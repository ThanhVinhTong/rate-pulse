import logging
import re
from datetime import datetime

from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from constants import get_bank_code, require_bank_constant
from fxs.FX import FX
from utils.checkers import check_currency_data
from utils.numeric_cleaner import parse_rate

logger = logging.getLogger(__name__)


class Eximbank(FX):
    def __init__(self, driver, connection, name="eximbank"):
        super().__init__(driver, connection)
        self.bank_constants = require_bank_constant(name)
        self.code = get_bank_code(name)

    def get_fx(self) -> None:
        name = self.code
        website = self.bank_constants.get_website()
        info = self.bank_constants.get_info()
        translate_column = self.bank_constants.get_translate_column()
        fx_list: list[dict] = []

        if not self.open_page(name=name, url=website):
            return

        tz_utc_plus_7 = self.vn_timezone()

        try:
            body_text = self.driver.find_element(By.TAG_NAME, "body").text
            match = re.search(
                r"Tỷ giá có hiệu lực từ\s*(\d{2}/\d{2}/\d{4})\s+(\d{2}:\d{2}:\d{2})",
                body_text,
            )
            if not match:
                logger.warning("%s: could not parse effective timestamp", name)
                updated_at = datetime.now(tz_utc_plus_7)
            else:
                date_time_str = f"{match.group(1)} {match.group(2)}"
                updated_at = datetime.strptime(date_time_str, "%d/%m/%Y %H:%M:%S").replace(tzinfo=tz_utc_plus_7)
        except (NoSuchElementException, ValueError) as e:
            logger.warning("%s: could not read listing timestamp; using current time: %s", name, e)
            updated_at = datetime.now(tz_utc_plus_7)

        try:
            table = self.driver.find_element(By.TAG_NAME, "table")
            tbody = table.find_element(By.TAG_NAME, "tbody")
        except NoSuchElementException as e:
            logger.warning("%s: rate table not found: %s", name, e)
            return

        try:
            expand_candidates = self.driver.find_elements(
                By.XPATH,
                "//div[contains(@class, 'cursor-pointer') and normalize-space()='Xem tất cả']",
            )
            if expand_candidates:
                self.driver.execute_script("arguments[0].click();", expand_candidates[0])
                WebDriverWait(self.driver, 10).until(
                    lambda d: len(tbody.find_elements(By.TAG_NAME, "tr")) >= 14
                )
        except Exception as e:
            if isinstance(e, TimeoutException):
                logger.warning("%s: table expansion timed out; continuing with current rows", name)
            else:
                logger.warning("%s: could not expand table with 'Xem tất cả': %s", name, e)

        rows = tbody.find_elements(By.TAG_NAME, "tr")
        row_error_count = 0
        for row_index, row in enumerate(rows, start=1):
            try:
                cells = row.find_elements(By.TAG_NAME, "td")
                if len(cells) < 5:
                    continue

                raw_currency = cells[0].text.strip()
                currency_match = re.search(r"\b([A-Z]{3})\b", raw_currency or "")
                currency_code = currency_match.group(1) if currency_match else ""
                if not currency_code or not check_currency_data(currency_code):
                    continue

                if currency_code == "USD" and "50-100" not in raw_currency:
                    continue

                rates_to_save = {
                    info["buy_cash"]: parse_rate(cells[1].text),
                    info["buy_transfer"]: parse_rate(cells[2].text),
                    info["sell_cash"]: parse_rate(cells[3].text),
                    info["sell_transfer"]: parse_rate(cells[4].text),
                }

                self.append_rates(
                    fx_list=fx_list,
                    source_code=name,
                    source_currency=info["source_currency"],
                    destination_currency=currency_code,
                    rates_by_type=rates_to_save,
                    translate_column=translate_column,
                    valid_from_date=updated_at,
                )
            except Exception as e:
                row_error_count += 1
                self.log_row_error(name=name, row_index=row_index, row_text=row.text, error=e)
                continue

        db_result = self.save_to_db(fx_list)
        self.log_scrape_summary(
            name=name,
            source_record_count=len(rows),
            extracted_record_count=len(fx_list),
            db_result=db_result,
            row_error_count=row_error_count,
        )
