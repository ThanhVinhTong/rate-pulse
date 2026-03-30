import logging
import time
from datetime import datetime, timedelta, timezone

from selenium.common.exceptions import NoSuchElementException, WebDriverException
from selenium.webdriver.common.by import By

from constants import require_bank_constant
from fxs.FX import FX
from utils.checkers import check_currency_data
from utils.numeric_cleaner import clean_symbol, parse_rate

logger = logging.getLogger(__name__)


class VTB(FX):
    def __init__(self, driver, connection):
        super().__init__(driver, connection)
        self.bank_constants = require_bank_constant("vtb")

    def get_fx(self) -> None:
        name = "VTB"
        website = self.bank_constants.get_website()
        info = self.bank_constants.get_info()
        translate_column = self.bank_constants.get_translate_column()
        fx_list: list[dict] = []
        tz_utc_plus_7 = timezone(timedelta(hours=7), "UTC+7")

        try:
            self.driver.get(website)
            logger.info("Scraping FX from %s", website)
            time.sleep(5)
        except WebDriverException as e:
            logger.error("%s: navigation failed: %s", name, e)
            return

        try:
            date_input = self.driver.find_elements(By.TAG_NAME, "input")[0]
            date_str = (date_input.get_attribute("value") or "").strip()

            time_div = self.driver.find_elements(By.CLASS_NAME, "react-select__single-value")[0]
            time_str = time_div.text.strip()

            date_time_str = f"{date_str} {time_str}"
            updated_at = datetime.strptime(date_time_str, "%d/%m/%Y %H:%M:%S").replace(tzinfo=tz_utc_plus_7)
        except (NoSuchElementException, ValueError) as e:
            updated_at = datetime.now(tz_utc_plus_7)
            logger.warning(
                "%s: date/time parse failed (no FX widget today or DOM change); using fallback now (UTC+7): %s",
                name,
                e,
            )

        try:
            body = self.driver.find_elements(By.TAG_NAME, "tbody")[0]
        except NoSuchElementException as e:
            logger.warning("%s: rate table not found: %s", name, e)
            return

        rows = body.find_elements(By.TAG_NAME, "tr")
        currency_code = ""
        for row in rows:
            try:
                cells = row.find_elements(By.TAG_NAME, "td")
                if not cells:
                    continue

                if len(cells) == 3:
                    buy_cheque_val = cells[1].text.strip().replace(".", "").replace(",", ".")
                    rate_val = parse_rate(clean_symbol(buy_cheque_val))
                    if rate_val is not None and currency_code:
                        fx_list.append(
                            {
                                "source_code": "VTB",
                                "source_currency": info["source_currency"],
                                "destination_currency": currency_code,
                                "type_id": translate_column["buy_cheque"],
                                "rate_value": rate_val,
                                "valid_from_date": updated_at,
                            }
                        )
                else:
                    currency_code = cells[0].text.strip()
                    if not currency_code or not check_currency_data(currency_code):
                        continue

                    buy_cash = cells[1].text.strip().replace(".", "").replace(",", ".")
                    buy_transfer = cells[2].text.strip().replace(".", "").replace(",", ".")
                    sell_cash_transfer = cells[3].text.strip().replace(".", "").replace(",", ".")

                    temp_rates = {
                        "buy_cash": parse_rate(clean_symbol(buy_cash)),
                        "buy_transfer": parse_rate(clean_symbol(buy_transfer)),
                        "sell": parse_rate(clean_symbol(sell_cash_transfer)),
                    }

                    for type_name, rate_val in temp_rates.items():
                        if rate_val is not None:
                            fx_list.append(
                                {
                                    "source_code": "VTB",
                                    "source_currency": info["source_currency"],
                                    "destination_currency": currency_code,
                                    "type_id": translate_column[type_name],
                                    "rate_value": rate_val,
                                    "valid_from_date": updated_at,
                                }
                            )
            except Exception as e:
                logger.warning("%s: skipped row: %s", name, e)
                continue

        self.save_to_db(fx_list)
        logger.info("%s: collected %s rate row(s) for DB", name, len(fx_list))
