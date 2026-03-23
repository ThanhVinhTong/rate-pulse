import time
from collections import defaultdict
from datetime import datetime, timezone, timedelta

from selenium import webdriver
from selenium.webdriver.common.by import By
from sqlalchemy import text

from fxs.FX import FX
from constants import get_bank_constants, get_bank_update_time
from utils.numeric_cleaner import parse_rate

class VN(FX):
    def __init__(self, driver: webdriver.Edge, connection_engine: Engine) -> None:
        self.driver = driver
        self.bank_constants = get_bank_constants()
        self.connection = connection_engine.connect()
        self.current_time = datetime.now(timezone.utc).strftime("%H:%M:%S")

    def get_fx(self) -> None:
        # Grab current time as a timezone-AWARE UTC datetime
        current_dt_utc = datetime.now(timezone.utc)
        
        # Check if current time is in the window to get VCB fx
        vcb_schedules = get_bank_update_time("vcb")
        for schedule in vcb_schedules:
            time_str = schedule.split(" ")[0] # extract "hh:mm:ss"
            hour, minute, second = map(int, time_str.split(':'))
            
            # Build today's date using that specific time, attached to UTC+7
            tz_utc_plus_7 = timezone(timedelta(hours=7), 'UTC+7')
            schedule_dt = datetime.now(tz_utc_plus_7).replace(
                hour=hour, minute=minute, second=second, microsecond=0
            )
            open_window, close_window = schedule_dt, schedule_dt + timedelta(hours=1)
            if open_window <= current_dt_utc <= close_window:
                self.get_fx_vcb()
                break
            else:
                print(f"Not in window {open_window} - {close_window} to get VCB fx")
                break
        self.connection.close()

    def get_fx_vcb(self) -> None:
        website = self.bank_constants["vcb"].get_website()
        info = self.bank_constants["vcb"].get_info()
        translate_column = self.bank_constants["vcb"].get_translate_column()

        self.driver.get(website)
        print(f"Scraping fx from website {website} ...")
        time.sleep(5)

        date = self.driver.find_element(By.CLASS_NAME, "currency__description-top").text.split(" ")
        date_time_str = f"{date[-1]} {date[-3]}"
        tz_utc_plus_7 = timezone(timedelta(hours=7), 'UTC+7')
        updated_at = datetime.strptime(date_time_str, "%d/%m/%Y %H:%M").replace(tzinfo=tz_utc_plus_7)

        table = self.driver.find_element(By.CLASS_NAME, "table-responsive")
        tbody = table.find_element(By.TAG_NAME, "tbody")

        fx_list = []
        rows = tbody.find_elements(By.TAG_NAME, "tr")
        for row in rows:
            cells = row.find_elements(By.TAG_NAME, "td")

            currency_code = cells[0].text.strip()
            if not currency_code:
                continue

            rates_to_save = {
                info["buy_cash"]: parse_rate(cells[2].text),
                info["buy_transfer"]: parse_rate(cells[3].text),
                info["sell_cash_transfer"]: parse_rate(cells[4].text),
            }

            # Map them into individual rows
            for type_name, rate_val in rates_to_save.items():
                if rate_val is not None:
                    fx_list.append({
                        "source_code": "VCB", # Identifies the source
                        "source_currency": info["source_currency"],
                        "destination_currency": currency_code,
                        "type_id": translate_column[type_name], 
                        "rate_value": rate_val,
                        "valid_from_date": updated_at
                    })

        for fx in fx_list:
            print(f"Inserting {fx} ...")
            self.connection.execute(text(\
                "INSERT INTO exchange_rates (\
                    source_id, \
                    source_currency_id, \
                    destination_currency_id, \
                    type_id, \
                    rate_value, \
                    valid_from_date) \
                VALUES (\
                    (SELECT source_id FROM rate_sources WHERE source_code = :source_code), \
                    (SELECT currency_id FROM currencies WHERE currency_code = :source_currency), \
                    (SELECT currency_id FROM currencies WHERE currency_code = :destination_currency), \
                    :type_id, \
                    :rate_value, \
                    :valid_from_date \
                )"), fx)
            self.connection.commit()
        print(f"Inserted {len(fx_list)} records for VCB")

        return

    def get_fx_bidv(self) -> dict[str, dict[str, str]]:
        website = self.bank_constants["bidv"].get_website()
        info = self.bank_constants["bidv"].get_info()

        print(f"Scraping fx from website {website} ...")
        self.driver.get(website)
        time.sleep(5)

        tz_utc_plus_7 = timezone(timedelta(hours=7), 'UTC+7')
        updated_at = datetime.now(tz=tz_utc_plus_7)

        table = self.driver.find_element(By.CLASS_NAME, "table-reponsive")
        tbody = table.find_element(By.TAG_NAME, "tbody")
        rows = tbody.find_elements(By.TAG_NAME, "tr")
        for row in rows:
            cells = row.find_elements(By.TAG_NAME, "td")

            currency_code = cells[0].text.strip()
            currency_name = cells[1].text.strip()
            buy_cash = cells[2].text.strip()
            buy_transfer = cells[3].text.strip()
            sell = cells[4].text.strip()

            if not currency_code:
                continue

            fx_data[currency_code] = {
                info["source_currency"]: info["source_currency"],
                info["destination_currency"]: currency_code,
                info["buy_cash"]: buy_cash,
                info["buy_transfer"]: buy_transfer,
                info["sell_cash"]: sell,
                info["sell_transfer"]: sell,
                info["updated_at"]: updated_at,
            }
        
        return fx_data
    
    def get_fx_vtb(self) -> dict[str, dict[str, str]]:
        website = self.bank_constants["vtb"].get_website()
        info = self.bank_constants["vtb"].get_info()

        print(f"Scraping fx from website {website} ...")
        self.driver.get(website)
        time.sleep(5)
        
        date_input = self.driver.find_element(By.XPATH, "//input[@placeholder='DD/MM/YYYY']")
        time_text = self.driver.find_elements(By.CLASS_NAME, "react-select__single-value")[0].text.strip()
        updated_at = f"{date_input.get_attribute('value')} {time_text} {info['time_zone']}"

        table = self.driver.find_elements(By.CLASS_NAME, "table-pin-rows")[0]
        tbody = table.find_element(By.TAG_NAME, "tbody")
        rows = tbody.find_elements(By.TAG_NAME, "tr")
        currency_code = ""
        fx_data: dict[str, dict[str, str]] = {}
        for i, row in enumerate(rows):
            cells = row.find_elements(By.TAG_NAME, "td")
            if len(cells) < 4:
                fx_data[currency_code][info["buy_cheque"]] = cells[1].text.strip()
                continue

            currency_code = cells[0].text.strip()
            buy_cash = cells[1].text.strip()
            buy_transfer = cells[2].text.strip()
            sell = cells[3].text.strip()
            if not currency_code:
                continue

            fx_data[currency_code] = {
                info["source_currency"]: info["source_currency"],
                info["destination_currency"]: currency_code,
                info["buy_cash"]: buy_cash,
                info["buy_transfer"]: buy_transfer,
                info["sell_cash"]: sell,
                info["sell_transfer"]: sell,
                info["updated_at"]: updated_at,
            }

        return fx_data

    def get_fx_acb(self) -> dict[str, dict[str, str]]:
        # TODO: Implement this method
        website = self.bank_constants["acb"].get_website()
        info = self.bank_constants["acb"].get_info()

        print(f"Scraping fx from website {website} ...")
        self.driver.get(website)
        time.sleep(5)
        
        date_input = self.driver.find_element(By.CLASS_NAME, "heading-filter")[0].find_element(By.CLASS_NAME, "btn").text
        time_text = self.driver.find_elements(By.CLASS_NAME, "react-select__single-value")[0].text.strip()
        updated_at = f"{date_input.get_attribute('value')} {time_text} {info['time_zone']}"

        table = self.driver.find_elements(By.CLASS_NAME, "table-pin-rows")[0]
        tbody = table.find_element(By.TAG_NAME, "tbody")
        rows = tbody.find_elements(By.TAG_NAME, "tr")
        currency_code = ""
        fx_data: dict[str, dict[str, str]] = {}
        for i, row in enumerate(rows):
            cells = row.find_elements(By.TAG_NAME, "td")
            if len(cells) < 4:
                fx_data[currency_code][info["buy_cheque"]] = cells[1].text.strip()
                continue

            currency_code = cells[0].text.strip()
            buy_cash = cells[1].text.strip()
            buy_transfer = cells[2].text.strip()
            sell = cells[3].text.strip()
            if not currency_code:
                continue

            fx_data[currency_code] = {
                info["source_currency"]: info["source_currency"],
                info["destination_currency"]: currency_code,
                info["buy_cash"]: buy_cash,
                info["buy_transfer"]: buy_transfer,
                info["sell_cash"]: sell,
                info["sell_transfer"]: sell,
                info["updated_at"]: updated_at,
            }

        return fx_data