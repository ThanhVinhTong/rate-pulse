import logging
import time
from datetime import datetime, timedelta, timezone

from selenium.common.exceptions import NoSuchElementException, TimeoutException, WebDriverException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from constants import require_bank_constant
from fxs.FX import FX
from utils.checkers import check_currency_data
from utils.numeric_cleaner import parse_rate

logger = logging.getLogger(__name__)


class VCB(FX):
    def __init__(self, driver, connection):
        super().__init__(driver, connection)
        self.bank_constants = require_bank_constant("vcb")

    def get_fx(self) -> None:
        name = "VCB"
        website = self.bank_constants.get_website()
        info = self.bank_constants.get_info()
        translate_column = self.bank_constants.get_translate_column()
        fx_list: list[dict] = []

        try:
            self.driver.get(website)
            logger.info("Scraping FX from %s", website)
            body_outer = self.driver.execute_script("return document.body.outerHTML;")
            logger.warning("%s: body.outerHTML (first 20000 chars):\n%s", name, body_outer[:20000])
            time.sleep(5)
        except WebDriverException as e:
            logger.error("%s: navigation failed: %s", name, e)
            return

        tz_utc_plus_7 = timezone(timedelta(hours=7), "UTC+7")

        try:
            date_block = self.driver.find_element(By.CLASS_NAME, "currency__description-top").text.split()
            date_time_str = f"{date_block[-1]} {date_block[-3]}"
            updated_at = datetime.strptime(date_time_str, "%d/%m/%Y %H:%M").replace(tzinfo=tz_utc_plus_7)
        except (NoSuchElementException, ValueError, IndexError) as e:
            try:
                date_block = self.driver.find_element(By.CLASS_NAME, "currency__description-bottom").text.split()
                date_time_str = f"{date_block[-1]} {date_block[-3]}"
                updated_at = datetime.strptime(date_time_str, "%d/%m/%Y %H:%M").replace(tzinfo=tz_utc_plus_7)
            except (NoSuchElementException, ValueError, IndexError) as e:
                logger.warning(
                    "%s: could not read listing timestamp (no FX row for today, layout change, or downtime): %s",
                    name,
                    e,
                )
                return

        try:
            table = self.driver.find_element(By.CLASS_NAME, "table-responsive")
            tbody = table.find_element(By.TAG_NAME, "tbody")
        except NoSuchElementException as e:
            logger.warning("%s: rate table not found: %s", name, e)
            return

        # Expand the table until all rows are visible ("Xem thêm" -> "Thu gọn").
        # VCB renders the "see more" control as an <input id="load-more-label" value="Xem thêm">.
        try:
            wait = WebDriverWait(self.driver, 12)
            max_clicks = 20
            for _ in range(max_clicks):
                # If collapse button is visible, we're fully expanded.
                collapse_btns = self.driver.find_elements(By.XPATH, "//button[contains(., 'Thu gọn')]")
                if collapse_btns and collapse_btns[0].is_displayed():
                    break

                before = len(tbody.find_elements(By.TAG_NAME, "tr"))

                see_more_btns = self.driver.find_elements(By.ID, "load-more-label")
                if not see_more_btns:
                    break
                btn = see_more_btns[0]
                if (not btn.is_displayed()) or (not btn.is_enabled()):
                    break

                self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
                self.driver.execute_script("arguments[0].click();", btn)

                # Stop if no new rows appear (prevents infinite loops).
                try:
                    wait.until(lambda d: len(tbody.find_elements(By.TAG_NAME, "tr")) > before)
                except TimeoutException:
                    break

                time.sleep(0.3)
        except WebDriverException as e:
            logger.warning("%s: stopped expanding table (may be partial list): %s", name, e)

        rows = tbody.find_elements(By.TAG_NAME, "tr")
        for row in rows:
            try:
                cells = row.find_elements(By.TAG_NAME, "td")
                if not cells:
                    continue

                currency_code = cells[0].text.strip()
                if not currency_code or not check_currency_data(currency_code):
                    continue

                rates_to_save = {
                    info["buy_cash"]: parse_rate(cells[2].text),
                    info["buy_transfer"]: parse_rate(cells[3].text),
                    info["sell_cash_transfer"]: parse_rate(cells[4].text),
                }

                for type_name, rate_val in rates_to_save.items():
                    if rate_val is not None:
                        fx_list.append(
                            {
                                "source_code": "VCB",
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
