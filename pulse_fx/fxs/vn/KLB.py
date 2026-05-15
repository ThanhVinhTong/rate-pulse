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


class KLB(FX):
    def __init__(self, driver, connection, name="klb"):
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

        try:
            WebDriverWait(self.driver, 20).until(
                lambda d: d.find_elements(By.CSS_SELECTOR, "tbody tr")
            )
        except TimeoutException as e:
            logger.warning("%s: FX table rows did not load: %s", name, e)
            return

        updated_at = self._read_updated_at(name=name)
        if updated_at is None:
            return

        try:
            rows = self._find_rate_rows()
        except NoSuchElementException as e:
            logger.warning("%s: rate table not found: %s", name, e)
            return

        row_error_count = 0
        for row_index, row in enumerate(rows, start=1):
            try:
                cells = row.find_elements(By.TAG_NAME, "td")
                if len(cells) < 4:
                    continue

                currency_code = self._normalize_currency_code(cells[0].text)
                if not currency_code or not check_currency_data(currency_code):
                    continue

                rates_to_save = {
                    info["buy_cash"]: parse_rate(cells[1].text),
                    info["buy_transfer"]: parse_rate(cells[2].text),
                    info["sell_cash_transfer"]: parse_rate(cells[3].text),
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

    def _read_updated_at(self, *, name: str) -> datetime | None:
        tz_utc_plus_7 = self.vn_timezone()

        for selector in ("#searchDate", "#ctl00_ContentPlaceHolder2_hfDate"):
            nodes = self.driver.find_elements(By.CSS_SELECTOR, selector)
            if not nodes:
                continue

            raw_value = (nodes[0].get_attribute("value") or "").strip()
            if not raw_value:
                continue

            for fmt in ("%Y-%m-%d", "%d/%m/%Y"):
                try:
                    return datetime.strptime(raw_value, fmt).replace(tzinfo=tz_utc_plus_7)
                except ValueError:
                    continue

            logger.warning("%s: could not parse selected date %r", name, raw_value)

        return datetime.now(tz_utc_plus_7).replace(hour=0, minute=0, second=0, microsecond=0)

    def _find_rate_rows(self):
        tables = self.driver.find_elements(By.TAG_NAME, "table")
        for table in tables:
            rows = table.find_elements(By.CSS_SELECTOR, "tbody tr")
            data_rows = [
                row
                for row in rows
                if row.find_elements(By.TAG_NAME, "td")
                and row.find_elements(By.CLASS_NAME, "table-currency")
            ]
            if data_rows:
                return data_rows

        raise NoSuchElementException("no table with KLB FX rows")

    @staticmethod
    def _normalize_currency_code(raw_currency: str) -> str:
        raw_currency = (raw_currency or "").strip()
        if raw_currency in {"USD (5, 10, 20)", "USD (1, 2)"}:
            return ""

        match = re.search(r"\b([A-Z]{3})\b", raw_currency)
        return match.group(1) if match else raw_currency
