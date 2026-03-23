import time
from datetime import datetime, timezone, timedelta
from selenium.webdriver.common.by import By

from fxs.FX import FX
from constants import get_bank_constant
from utils.numeric_cleaner import parse_rate
from utils.checkers import check_currency_data

class BIDV(FX):
    def __init__(self, driver, connection):
        super().__init__(driver, connection)
        self.bank_constants = get_bank_constant('bidv')

    def get_fx(self) -> None:
        website = self.bank_constants.get_website()
        info = self.bank_constants.get_info()
        translate_column = self.bank_constants.get_translate_column()

        fx_list = []

        self.driver.get(website)
        print(f"Scraping fx from website {website} ...")
        time.sleep(5)

        note = self.driver.find_elements(By.ID, "noteContactVI")[1]
        raw_text = note.get_attribute("textContent").strip()
        parts = raw_text.split(" ")
        
        time_part = parts[3]
        date_part = parts[5]
        
        date_time_str = f"{date_part} {time_part}"
        tz_utc_plus_7 = timezone(timedelta(hours=7), 'UTC+7')
        updated_at = datetime.strptime(date_time_str, "%d/%m/%Y %H:%M").replace(tzinfo=tz_utc_plus_7)

        table = self.driver.find_element(By.CLASS_NAME, "table-reponsive")
        tbody = table.find_element(By.TAG_NAME, "tbody")
        rows = tbody.find_elements(By.TAG_NAME, "tr")
        for row in rows:
            cells = row.find_elements(By.TAG_NAME, "td")

            currency_code = cells[0].text.strip()
            if not currency_code or not check_currency_data(currency_code):
                continue
            currency_name = cells[1].text.strip()
            buy_cash = cells[2].text.strip()
            buy_transfer = cells[3].text.strip()
            sell = cells[4].text.strip()

            rates_to_save = {
                info["buy_cash_cheque"]: parse_rate(cells[2].text),
                info["buy_transfer"]: parse_rate(cells[3].text),
                info["sell_cash_transfer"]: parse_rate(cells[4].text),
            }

            # Map them into individual rows
            for type_name, rate_val in rates_to_save.items():
                if rate_val is not None:
                    fx_list.append({
                        "source_code": "BIDV", # Identifies the source
                        "source_currency": info["source_currency"],
                        "destination_currency": currency_code,
                        "type_id": translate_column[type_name], 
                        "rate_value": rate_val,
                        "valid_from_date": updated_at
                    })
        self.save_to_db(fx_list)