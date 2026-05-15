import logging
import re
from datetime import datetime

from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from constants import get_bank_code, require_bank_constant
from fxs.FX import FX
from utils.checkers import check_currency_data
from utils import numeric_cleaner

logger = logging.getLogger(__name__)

class HSBCVN(FX):
    def __init__(self, driver, connection, name="hsbcvn"):
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
            WebDriverWait(self.driver, 15).until(
                lambda d: d.find_elements(By.CSS_SELECTOR, "table.desktop")
            )
        except TimeoutException as e:
            logger.warning("%s: desktop FX tables did not load: %s", name, e)
            return

        updated_at = self._read_updated_at(name=name, tz_utc_plus_7=tz_utc_plus_7)
        if updated_at is None:
            return

        try:
            table = self._find_rate_table()
        except NoSuchElementException as e:
            logger.warning("%s: rate table not found: %s", name, e)
            return

        rows = table.find_elements(By.CSS_SELECTOR, "tbody tr")
        row_error_count = 0
        for row_index, row in enumerate(rows, start=1):
            try:
                currency_cell = row.find_element(By.CSS_SELECTOR, "th[scope='row']")
                cells = row.find_elements(By.TAG_NAME, "td")
                if len(cells) < 4:
                    continue

                currency_code = self._extract_currency_code(currency_cell.text)
                if not currency_code or not check_currency_data(currency_code):
                    continue

                rates_to_save = {
                    info["buy_cash"]: numeric_cleaner.parse_rate(cells[0].text),
                    info["buy_transfer"]: numeric_cleaner.parse_rate(cells[1].text),
                    info["sell_cash"]: numeric_cleaner.parse_rate(cells[2].text),
                    info["sell_transfer"]: numeric_cleaner.parse_rate(cells[3].text),
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

    def _read_updated_at(self, *, name: str, tz_utc_plus_7) -> datetime | None:
        tables = self.driver.find_elements(By.CSS_SELECTOR, "table.desktop")
        for table in tables:
            caption_text = table.find_element(By.TAG_NAME, "caption").text
            match = re.search(r"(\d{2}/\d{2}/\d{4}),\s*(\d{2}:\d{2})", caption_text)
            if not match:
                continue

            date_time_str = f"{match.group(1)} {match.group(2)}"
            try:
                return datetime.strptime(date_time_str, "%d/%m/%Y %H:%M").replace(tzinfo=tz_utc_plus_7)
            except ValueError as e:
                logger.warning("%s: could not parse update time %r: %s", name, date_time_str, e)
                return None

        logger.warning("%s: update timestamp not found in desktop table captions", name)
        return None

    def _find_rate_table(self):
        tables = self.driver.find_elements(By.CSS_SELECTOR, "table.desktop")
        for table in tables:
            rows = table.find_elements(By.CSS_SELECTOR, "tbody tr")
            if not rows:
                continue

            for row in rows:
                has_currency_header = row.find_elements(By.CSS_SELECTOR, "th[scope='row']")
                has_rate_columns = len(row.find_elements(By.TAG_NAME, "td")) >= 4
                if has_currency_header and has_rate_columns:
                    return table

        raise NoSuchElementException("no desktop table with currency rows and four rate columns")

    @staticmethod
    def _extract_currency_code(raw_currency: str) -> str:
        match = re.search(r"\(([A-Z]{3})\)", raw_currency or "")
        if match:
            return match.group(1)

        match = re.search(r"\b[A-Z]{3}\b", raw_currency or "")
        return match.group(0) if match else ""
