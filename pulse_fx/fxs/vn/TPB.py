import logging
from datetime import datetime

from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait

from constants import require_bank_constant, get_bank_code
from fxs.FX import FX
from utils.checkers import check_currency_data
from utils.numeric_cleaner import parse_rate

logger = logging.getLogger(__name__)


class TPB(FX):
    def __init__(self, driver, connection, name="tpb"):
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
                lambda d: d.find_elements(By.CSS_SELECTOR, "#forex-rate-table-container table.table tbody tr")
            )
        except TimeoutException as e:
            logger.warning("%s: FX table rows did not load: %s", name, e)
            return

        updated_at = self._read_updated_at(name=name)
        if updated_at is None:
            return

        try:
            table = self.driver.find_element(By.CSS_SELECTOR, "#forex-rate-table-container table.table")
            tbody = table.find_element(By.TAG_NAME, "tbody")
        except NoSuchElementException as e:
            logger.warning("%s: rate table not found: %s", name, e)
            return

        rows = tbody.find_elements(By.TAG_NAME, "tr")
        row_error_count = 0
        for row_index, row in enumerate(rows, start=1):
            try:
                cells = row.find_elements(By.TAG_NAME, "td")
                if len(cells) < 6:
                    continue

                currency_code = cells[0].text.strip()
                if not currency_code or not check_currency_data(currency_code):
                    continue

                rates_to_save = {
                    info["buy_cash"]: parse_rate(cells[2].text),
                    info["buy_transfer"]: parse_rate(cells[3].text),
                    info["sell_cash"]: parse_rate(cells[4].text),
                    info["sell_transfer"]: parse_rate(cells[5].text),
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

        timestamp = self._read_active_timestamp()
        if timestamp:
            try:
                return datetime.strptime(timestamp, "%Y%m%d%H%M%S").replace(tzinfo=tz_utc_plus_7)
            except ValueError as e:
                logger.warning("%s: could not parse active timestamp %r: %s", name, timestamp, e)

        date_text = self._first_text(
            "#forex-rate-table-container .date-title",
            "#datepickerInput",
        )
        time_text = self._first_text("#search-timerate")
        if not date_text or not time_text:
            logger.warning("%s: update date/time not found", name)
            return None

        date_text = date_text.replace("-", "/").split()[0].strip()
        try:
            return datetime.strptime(f"{date_text} {time_text}", "%d/%m/%Y %H:%M:%S").replace(tzinfo=tz_utc_plus_7)
        except ValueError as e:
            logger.warning("%s: could not parse update date/time %r %r: %s", name, date_text, time_text, e)
            return None

    def _read_active_timestamp(self) -> str:
        active_time_nodes = self.driver.find_elements(By.CSS_SELECTOR, "#list-time-rate li.active a")
        if not active_time_nodes:
            active_time_nodes = self.driver.find_elements(By.CSS_SELECTOR, "#list-time-rate li:last-child a")

        for node in active_time_nodes:
            timestamp = (node.get_attribute("title") or "").strip()
            if timestamp:
                return timestamp

        return ""

    def _first_text(self, *selectors: str) -> str:
        for selector in selectors:
            nodes = self.driver.find_elements(By.CSS_SELECTOR, selector)
            if not nodes:
                continue

            if selector == "#datepickerInput":
                value = (nodes[0].get_attribute("value") or "").strip()
            else:
                value = nodes[0].text.strip()

            if value:
                return value

        return ""
