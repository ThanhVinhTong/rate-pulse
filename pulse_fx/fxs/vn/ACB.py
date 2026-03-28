import time
from datetime import datetime, timezone, timedelta
from selenium.webdriver.common.by import By

from fxs.FX import FX
from constants import get_bank_constant
from utils.numeric_cleaner import parse_rate
from utils.checkers import check_currency_data

class ACB(FX):
    def __init__(self, driver, connection):
        super().__init__(driver, connection)
        self.bank_constants = get_bank_constant('acb')

    def get_fx(self) -> None:
        website = self.bank_constants.get_website()
        info = self.bank_constants.get_info()
        translate_column = self.bank_constants.get_translate_column()

        fx_list = []
        """
            Get updated time from another website
        """
        self.driver.get("https://webgia.com/ty-gia/acb/")
        time.sleep(1)
        note = self.driver.find_elements(By.CLASS_NAME, "h-head")[-1]
        raw_text = note.get_attribute("textContent").strip()
        parts = raw_text.split(" ")
        time_part = parts[-2]
        date_part = parts[-1]
        
        date_time_str = f"{date_part} {time_part}"
        tz_utc_plus_7 = timezone(timedelta(hours=7), 'UTC+7')
        updated_at = datetime.strptime(date_time_str, "%d/%m/%Y %H:%M:%S").replace(tzinfo=tz_utc_plus_7)

        """
            Scrape fx from main website
        """
        self.driver.get(website)
        print(f"Scraping fx from website {website} ...")
        time.sleep(5)

        # Click the "Xem thêm" button until "Thu gọn" appears
        try:
            while True:
                # If "Thu gọn" is present, the table is fully expanded
                thu_gon_btns = self.driver.find_elements(By.XPATH, "//a[contains(., 'Thu gọn')]")
                if len(thu_gon_btns) > 0 and thu_gon_btns[0].is_displayed():
                    break
                    
                see_more_btns = self.driver.find_elements(By.XPATH, "//a[contains(., 'Xem thêm')]")
                if not see_more_btns:
                    break
                    
                self.driver.execute_script("arguments[0].click();", see_more_btns[0])
                time.sleep(1)  # Wait for the table to expand
        except Exception as e:
            print(f"Error while expanding table: {e}")

        table = self.driver.find_element(By.CLASS_NAME, "list-ty-gia")
        rows = table.find_elements(By.TAG_NAME, "div")[1:]
        for row in rows:
            cells = row.find_elements(By.CLASS_NAME, "item-col")

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
                        "source_code": "ACB", # Identifies the source
                        "source_currency": info["source_currency"],
                        "destination_currency": currency_code,
                        "type_id": translate_column[type_name], 
                        "rate_value": rate_val,
                        "valid_from_date": updated_at
                    })
        self.save_to_db(fx_list)
        print(f"Scraped {len(fx_list)} fx from ACB")