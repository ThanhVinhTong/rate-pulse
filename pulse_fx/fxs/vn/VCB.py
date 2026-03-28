import time
from datetime import datetime, timezone, timedelta
from selenium.webdriver.common.by import By

from fxs.FX import FX
from constants import get_bank_constant
from utils.numeric_cleaner import parse_rate
from utils.checkers import check_currency_data

class VCB(FX):
    def __init__(self, driver, connection):
        super().__init__(driver, connection)
        self.bank_constants = get_bank_constant('vcb')

    def get_fx(self) -> None:
        website = self.bank_constants.get_website()
        info = self.bank_constants.get_info()
        translate_column = self.bank_constants.get_translate_column()

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
            if not currency_code or not check_currency_data(currency_code):
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
        self.save_to_db(fx_list)
        print(f"Scraped {len(fx_list)} fx from VCB")
