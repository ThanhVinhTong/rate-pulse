import logging
import re, time
from datetime import datetime

from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from constants import get_bank_code, require_bank_constant
from fxs.FX import FX
from utils.checkers import check_currency_data
from utils.numeric_cleaner import parse_rate

logger = logging.getLogger(__name__)


class TCB(FX):
    def __init__(self, driver, connection, name="tcb"):
        super().__init__(driver, connection)
        self.bank_constants = require_bank_constant(name)
        self.code = get_bank_code(name)

    def get_fx(self) -> None:
        name = self.code
        website = self.bank_constants.get_website()
        info = self.bank_constants.get_info()
        translate_column = self.bank_constants.get_translate_column()
        fx_list: list[dict] = []
        tz_utc_plus_7 = self.vn_timezone()

        if not self.open_page(name=name, url=website):
            return

        updated_at = self._read_updated_at(tz_utc_plus_7)

        content = self._find_main_rate_content(name)
        if content is None:
            return

        rows = content.find_elements(By.CLASS_NAME, "exchange-rate__table-records")
        row_error_count = 0
        for row_index, row in enumerate(rows, start=1):
            try:
                columns = row.find_elements(By.CLASS_NAME, "table__first-column")
                if len(columns) < 2:
                    continue

                currency_code = columns[0].find_element(By.TAG_NAME, "p").text.strip()
                currency_code = self._normalize_currency_code(currency_code)
                if not currency_code:
                    continue

                if not check_currency_data(currency_code):
                    continue

                data_items = row.find_elements(By.CLASS_NAME, "data-content__item")
                if len(data_items) < 4:
                    row_error_count += 1
                    logger.warning(
                        "%s: skipped source row %s for %s | expected at least 4 rate cells, found %s",
                        name,
                        row_index,
                        currency_code,
                        len(data_items),
                    )
                    continue

                rates_to_save = {
                    info["buy_cash_cheque"]: parse_rate(data_items[0].text),
                    info["buy_transfer"]: parse_rate(data_items[1].text),
                    info["sell_cash"]: parse_rate(data_items[2].text),
                    info["sell_transfer"]: parse_rate(data_items[3].text),
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

    def _find_main_rate_content(self, name: str):
        try:
            candidate_sections = self.driver.find_elements(By.CLASS_NAME, "title-cmp__title")
            for candidate in candidate_sections:
                if "Tỷ giá hối đoái" in candidate.text:
                    self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", candidate)
                    time.sleep(5)
            return WebDriverWait(self.driver, 15).until(self._main_rate_content_is_ready)
        except TimeoutException as e:
            logger.warning("%s: main exchange rate table content not loaded: %s", name, e)
            return None

    def _main_rate_content_is_ready(self, driver):
        contents = driver.find_elements(
            By.CSS_SELECTOR,
            ".exchange-rate__table-content .exchange-rate-table-content",
        )
        for content in contents:
            if self._inside_popup(content):
                continue
            rows = content.find_elements(By.CLASS_NAME, "exchange-rate__table-records")
            if rows:
                return content
        return False

    def _inside_popup(self, element) -> bool:
        return bool(
            self.driver.execute_script(
                "return Boolean(arguments[0].closest('.exchange-rate__popup'));",
                element,
            )
        )

    def _read_updated_at(self, tz_utc_plus_7) -> datetime:
        selected_date = self._read_first_text(By.CSS_SELECTOR, ".exchange-rate__header .calendar__input-field")
        selected_time = self._read_first_text(By.CSS_SELECTOR, ".exchange-rate__header .selected-time-slot")
        if selected_date:
            try:
                time_part = selected_time or "00:00:00"
                fmt = "%d/%m/%Y %H:%M:%S" if time_part.count(":") == 2 else "%d/%m/%Y %H:%M"
                return datetime.strptime(f"{selected_date} {time_part}", fmt).replace(tzinfo=tz_utc_plus_7)
            except ValueError as e:
                logger.warning("TCB: could not parse selected date/time; trying table note: %s", e)

        try:
            notes = self.driver.find_elements(By.CLASS_NAME, "exchange-rate__table-note")
            for note in notes:
                raw_text = (note.get_attribute("textContent") or "").strip()
                match = re.search(r"(\d{2}/\d{2}/\d{4})(?:\s+(\d{2}:\d{2}(?::\d{2})?))?", raw_text)
                if not match:
                    continue

                date_part = match.group(1)
                time_part = match.group(2) or "00:00:00"
                fmt = "%d/%m/%Y %H:%M:%S" if time_part.count(":") == 2 else "%d/%m/%Y %H:%M"
                return datetime.strptime(f"{date_part} {time_part}", fmt).replace(tzinfo=tz_utc_plus_7)
        except Exception as e:
            logger.warning("TCB: could not parse update timestamp; using fallback now (UTC+7): %s", e)

        return datetime.now(tz_utc_plus_7)

    def _read_first_text(self, by: str, selector: str) -> str:
        elements = self.driver.find_elements(by, selector)
        if not elements:
            return ""
        return elements[0].text.strip()

    @staticmethod
    def _normalize_currency_code(raw_code: str) -> str:
        if raw_code in {"USD (1,2)", "USD (5,10,20)"}:
            return ""
        if raw_code == "USD (50,100)":
            return "USD"
        return raw_code
