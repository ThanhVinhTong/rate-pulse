import time
from datetime import datetime, timezone, timedelta
from selenium.webdriver.common.by import By

from fxs.FX import FX
from constants import get_bank_constant
from utils.numeric_cleaner import parse_rate
from utils.checkers import check_currency_data

class VTB(FX):
    def __init__(self, driver, connection):
        super().__init__(driver, connection)
        self.bank_constants = get_bank_constant('vtb')

    def get_fx(self) -> None:
        website = self.bank_constants.get_website()
        info = self.bank_constants.get_info()
        translate_column = self.bank_constants.get_translate_column()

        fx_list = []
        self.driver.get(website)
        print(f"Scraping fx from website {website} ...")
        time.sleep(5)

        # Get updated time from the DOM
        try:
            date_input = self.driver.find_element(By.XPATH, "//p[contains(text(), 'Ngày cập nhật')]/following-sibling::div//input")
            date_str = date_input.get_attribute("value").strip()

            time_div = self.driver.find_element(By.XPATH, "//p[contains(text(), 'Thời điểm cập nhật')]/following-sibling::div//div[contains(@class, 'single-value')]")
            time_str = time_div.text.strip()

            date_time_str = f"{date_str} {time_str}"
            tz_utc_plus_7 = timezone(timedelta(hours=7), 'UTC+7')
            updated_at = datetime.strptime(date_time_str, "%d/%m/%Y %H:%M:%S").replace(tzinfo=tz_utc_plus_7)
        except Exception as e:
            print(f"Error parsing date/time for VTB: {e}")
            updated_at = datetime.now(timezone(timedelta(hours=7), 'UTC+7')) # fallback to now

        # Scrape fx from first found table
        table = self.driver.find_element(By.TAG_NAME, "table")
        body = table.find_element(By.TAG_NAME, 'tbody')
        rows = body.find_elements(By.TAG_NAME, "tr")
        
        currency_code = ""
        for row in rows:
            cells = row.find_elements(By.TAG_NAME, "div")[1:]

            # Check if cells exist in this div. Non-row divs will return an empty list and cause an IndexError.
            if not cells:
                continue

            currency_code = cells[0].find_element(By.TAG_NAME, "h4").text.strip()
            if currency_code == "USD (50,100)":
                currency_code = "USD"

            if not currency_code or not check_currency_data(currency_code):
                continue

            buy_cash = cells[1].find_element(By.TAG_NAME, "span").text.strip()
            buy_transfer = cells[2].find_element(By.TAG_NAME, "span").text.strip()
            sell_cash = cells[3].find_element(By.TAG_NAME, "span").text.strip()
            sell_transfer = cells[4].find_element(By.TAG_NAME, "span").text.strip()

            rates_to_save = {
                info["buy_cash"]: parse_rate(buy_cash),
                info["buy_transfer"]: parse_rate(buy_transfer),
                info["sell_cash"]: parse_rate(sell_cash),
                info["sell_transfer"]: parse_rate(sell_transfer),
            }

            # Map them into individual rows
            for type_name, rate_val in rates_to_save.items():
                if rate_val is not None:
                    fx_list.append({
                        "source_code": "VTB", # Identifies the source
                        "source_currency": info["source_currency"],
                        "destination_currency": currency_code,
                        "type_id": translate_column[type_name], 
                        "rate_value": rate_val,
                        "valid_from_date": updated_at
                    })
        self.save_to_db(fx_list)