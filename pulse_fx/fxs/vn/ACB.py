import logging
import time
from datetime import datetime, timedelta, timezone

from selenium.common.exceptions import NoSuchElementException, WebDriverException
from selenium.webdriver.common.by import By

from constants import require_bank_constant
from fxs.FX import FX
from utils.checkers import check_currency_data
from utils.numeric_cleaner import parse_rate

logger = logging.getLogger(__name__)

WEBGIA_ACB = "https://webgia.com/ty-gia/acb/"


class ACB(FX):
    def __init__(self, driver, connection):
        super().__init__(driver, connection)
        self.bank_constants = require_bank_constant("acb")

    def get_fx(self) -> None:
        name = "ACB"
        website = self.bank_constants.get_website()
        info = self.bank_constants.get_info()
        translate_column = self.bank_constants.get_translate_column()
        fx_list: list[dict] = []
        tz_utc_plus_7 = timezone(timedelta(hours=7), "UTC+7")

        updated_at: datetime | None = None
        try:
            self.driver.get(WEBGIA_ACB)
            time.sleep(1)
            heads = self.driver.find_elements(By.CLASS_NAME, "h-head")
            if not heads:
                logger.warning("%s: webgia.com header line not found; will use fallback timestamp", name)
            else:
                raw_text = (heads[-1].get_attribute("textContent") or "").strip()
                parts = raw_text.split()
                time_part = parts[-2]
                date_part = parts[-1]
                date_time_str = f"{date_part} {time_part}"
                updated_at = datetime.strptime(date_time_str, "%d/%m/%Y %H:%M:%S").replace(tzinfo=tz_utc_plus_7)
        except WebDriverException as e:
            logger.warning("%s: webgia.com navigation or DOM error: %s", name, e)
        except (IndexError, ValueError) as e:
            logger.warning("%s: could not parse webgia timestamp (layout or empty page): %s", name, e)

        if updated_at is None:
            updated_at = datetime.now(tz_utc_plus_7)
            logger.info("%s: using fallback timestamp (UTC+7 now) for valid_from_date", name)

        try:
            self.driver.get(website)
            logger.info("Scraping FX from %s", website)
            time.sleep(5)
        except WebDriverException as e:
            logger.error("%s: main site navigation failed: %s", name, e)
            return

        try:
            while True:
                thu_gon_btns = self.driver.find_elements(By.XPATH, "//a[contains(., 'Thu gọn')]")
                if len(thu_gon_btns) > 0 and thu_gon_btns[0].is_displayed():
                    break

                see_more_btns = self.driver.find_elements(By.XPATH, "//a[contains(., 'Xem thêm')]")
                if not see_more_btns:
                    break

                self.driver.execute_script("arguments[0].click();", see_more_btns[0])
                time.sleep(1)
        except WebDriverException as e:
            logger.warning("%s: stopped expanding table (may be partial list): %s", name, e)

        try:
            table = self.driver.find_element(By.CLASS_NAME, "list-ty-gia")
        except NoSuchElementException as e:
            logger.warning("%s: rate list container not found: %s", name, e)
            return

        rows = table.find_elements(By.TAG_NAME, "div")[1:]
        for row in rows:
            try:
                cells = row.find_elements(By.CLASS_NAME, "item-col")
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

                for type_name, rate_val in rates_to_save.items():
                    if rate_val is not None:
                        fx_list.append(
                            {
                                "source_code": "ACB",
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
