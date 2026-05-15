import logging
from datetime import datetime

from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By

from constants import get_bank_code, require_bank_constant
from fxs.FX import FX
from utils.checkers import check_currency_data
from utils.dom_helpers import find_table_by_class_variants
from utils.numeric_cleaner import parse_rate

logger = logging.getLogger(__name__)


class BIDV(FX):
    def __init__(self, driver, connection, name="bidv"):
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
            notes = self.driver.find_elements(By.ID, "noteContactVI")
            if len(notes) < 2:
                logger.warning(
                    "%s: update note (#noteContactVI) missing or page incomplete — may be no FX data today",
                    name,
                )
                return
            raw_text = notes[1].get_attribute("textContent") or ""
            raw_text = raw_text.strip()
            parts = raw_text.split()
            time_part = parts[3]
            date_part = parts[5]
            date_time_str = f"{date_part} {time_part}"
            updated_at = datetime.strptime(date_time_str, "%d/%m/%Y %H:%M").replace(tzinfo=tz_utc_plus_7)
        except (IndexError, ValueError) as e:
            logger.warning(
                "%s: could not parse update time from page (format change or empty state): %s",
                name,
                e,
            )
            return

        try:
            tbody = find_table_by_class_variants(
                self.driver,
                ("table-reponsive", "table-responsive"),
            )
        except NoSuchElementException as e:
            logger.warning("%s: rate table not found (typo class vs fixed site, or no table): %s", name, e)
            return

        rows = tbody.find_elements(By.TAG_NAME, "tr")
        row_error_count = 0
        for row_index, row in enumerate(rows, start=1):
            try:
                cells = row.find_elements(By.TAG_NAME, "td")
                if not cells:
                    continue

                currency_code = cells[0].text.strip()
                if not currency_code or not check_currency_data(currency_code):
                    continue

                rates_to_save = {
                    info["buy_cash_cheque"]: parse_rate(cells[2].text),
                    info["buy_transfer"]: parse_rate(cells[3].text),
                    info["sell_cash_transfer"]: parse_rate(cells[4].text),
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
