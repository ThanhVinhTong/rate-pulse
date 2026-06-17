import logging
import re
from datetime import datetime, timedelta, timezone

from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from constants import get_bank_code, require_bank_constant
from fxs.FX import FX
from utils.checkers import check_currency_data
logger = logging.getLogger(__name__)


class CBA(FX):
    def __init__(self, driver, connection, name="cba"):
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

        tz_aest = timezone(timedelta(hours=10), "AEST")

        try:
            table = WebDriverWait(self.driver, 15).until(lambda d: self._find_rate_table())
        except TimeoutException as e:
            logger.warning("%s: FX table did not load: %s", name, e)
            return

        updated_at = self._read_updated_at(name=name, tz_aest=tz_aest)
        if updated_at is None:
            return

        rows = table.find_elements(By.CSS_SELECTOR, ".table-body [role='row']")
        row_error_count = 0
        for row_index, row in enumerate(rows, start=1):
            try:
                cells = row.find_elements(By.CSS_SELECTOR, ":scope > .table-row-item")
                if len(cells) < 8:
                    continue

                currency_code = self._extract_currency_code(cells[1].find_element(By.CSS_SELECTOR, "div[role='cell']").text)
                if not currency_code or not check_currency_data(currency_code):
                    continue

                rates_to_save = {
                    info["send_imt"]: self._parse_rate(cells[2].find_element(By.CSS_SELECTOR, "div[role='cell']").text),
                    info["receive_imt"]: self._parse_rate(cells[3].find_element(By.CSS_SELECTOR, "div[role='cell']").text),
                    info["load_currency_to_tmc"]: self._parse_rate(cells[4].find_element(By.CSS_SELECTOR, "div[role='cell']").text),
                    info["unload_currency_from_tmc"]: self._parse_rate(cells[5].find_element(By.CSS_SELECTOR, "div[role='cell']").text),
                    info["get_foreign_cash"]: self._parse_rate(cells[6].find_element(By.CSS_SELECTOR, "div[role='cell']").text),
                    info["change_foreign_cash"]: self._parse_rate(cells[7].find_element(By.CSS_SELECTOR, "div[role='cell']").text),
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

    def _find_rate_table(self):
        tables = self.driver.find_elements(By.CSS_SELECTOR, "div[role='table']")
        for table in tables:
            header_text = " ".join(header.text.strip() for header in table.find_elements(By.CSS_SELECTOR, "[role='columnheader']"))
            required_headers = ["Send IMT", "Receive IMT", "Load currency to TMC", "Unload currency from TMC", "Get foreign cash", "Change foreign cash"]
            if not all(header in header_text for header in required_headers):
                continue

            rows = table.find_elements(By.CSS_SELECTOR, ".table-body [role='row']")
            for row in rows:
                cells = row.find_elements(By.CSS_SELECTOR, ":scope > .table-row-item")
                if len(cells) >= 8:
                    return table

        raise NoSuchElementException("no CommBank FX table with currency rows and six rate columns")

    def _read_updated_at(self, *, name: str, tz_aest) -> datetime | None:
        candidates = self.driver.find_elements(By.XPATH, "//*[contains(normalize-space(.), 'Rates are expressed as 1 AUD')]")
        for candidate in candidates:
            text = candidate.text.strip().replace("\n", " ")
            match = re.search(
                r"current as at\s+(\d{1,2}:\d{2}\s*[ap]m)\s+\(Australian EST\)\s+on\s+(\d{2}/\d{2}/\d{4})",
                text,
                re.IGNORECASE,
            )
            if not match:
                continue

            date_time_str = f"{match.group(2)} {match.group(1).upper().replace('  ', ' ')}"
            try:
                return datetime.strptime(date_time_str, "%d/%m/%Y %I:%M %p").replace(tzinfo=tz_aest)
            except ValueError as e:
                logger.warning("%s: could not parse update time %r: %s", name, date_time_str, e)
                return None

        logger.warning("%s: update timestamp not found on FX page", name)
        return None

    @staticmethod
    def _extract_currency_code(raw_currency: str) -> str:
        match = re.search(r"\b[A-Z]{3}\b", raw_currency or "")
        return match.group(0) if match else ""

    @staticmethod
    def _parse_rate(raw_rate: str) -> float | None:
        text = (raw_rate or "").strip()
        if not text or text in {"-", "—"}:
            return None

        try:
            return float(text.replace(",", ""))
        except ValueError:
            return None
