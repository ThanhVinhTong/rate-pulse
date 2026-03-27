import time
from datetime import datetime, timezone, timedelta
from selenium.webdriver.common.by import By

from fxs.FX import FX
from constants import get_bank_constant
from utils.numeric_cleaner import parse_rate, clean_symbol
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
        table = self.driver.find_elements(By.CLASS_NAME, "table-pin-rows")[0]
        body = table.find_element(By.TAG_NAME, 'tbody')
        rows = body.find_elements(By.TAG_NAME, "tr")
        
        currency_code = ""
        for row in rows:
            cells = row.find_elements(By.TAG_NAME, "td")

            # Check if cells exist in this div. Non-row divs will return an empty list and cause an IndexError.
            if not cells:
                continue
            
            if len(cells) == 3:
                # This sub-row provides the "buy_cheque" rate for the current currency
                buy_cheque_val = cells[1].text.strip().replace('.', '').replace(',', '.')
                rate_val = parse_rate(clean_symbol(buy_cheque_val))
                if rate_val is not None:
                    fx_list.append({
                        "source_code": "VTB",
                        "source_currency": info["source_currency"],
                        "destination_currency": currency_code,
                        "type_id": translate_column["buy_cheque"], 
                        "rate_value": rate_val,
                        "valid_from_date": updated_at
                    })
            else:
                currency_code = cells[0].text.strip()
                if not currency_code or not check_currency_data(currency_code):
                    continue

                buy_cash = cells[1].text.strip().replace('.', '').replace(',', '.')
                buy_transfer = cells[2].text.strip().replace('.', '').replace(',', '.')
                sell_cash_transfer = cells[3].text.strip().replace('.', '').replace(',', '.')

                # For main currency rows, the "buy_cheque" is usually not in this row
                # We initialize rates to save for this main row only
                temp_rates = {
                    "buy_cash": parse_rate(clean_symbol(buy_cash)),
                    "buy_transfer": parse_rate(clean_symbol(buy_transfer)),
                    "sell": parse_rate(clean_symbol(sell_cash_transfer)),
                }

                for type_name, rate_val in temp_rates.items():
                    if rate_val is not None:
                        fx_list.append({
                            "source_code": "VTB",
                            "source_currency": info["source_currency"],
                            "destination_currency": currency_code,
                            "type_id": translate_column[type_name], 
                            "rate_value": rate_val,
                            "valid_from_date": updated_at
                        })
        self.save_to_db(fx_list)