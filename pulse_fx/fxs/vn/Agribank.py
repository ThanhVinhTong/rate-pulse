import logging
import re
from datetime import datetime

from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By

from constants import require_bank_constant
from fxs.FX import FX
from utils.checkers import check_currency_data
from utils.numeric_cleaner import parse_rate

logger = logging.getLogger(__name__)


class Agribank(FX):
    def __init__(self, driver, connection):
        super().__init__(driver, connection)
        self.bank_constants = require_bank_constant("agribank")

    def get_fx(self) -> None:
        name = "AGRIBANK"
        website = self.bank_constants.get_website()
        info = self.bank_constants.get_info()
        translate_column = self.bank_constants.get_translate_column()
        fx_list: list[dict] = []

        if not self.open_page(name=name, url=website):
            return

        tz_utc_plus_7 = self.vn_timezone()

        try:
            container = self.driver.find_element(By.ID, "tyGiaCn")
            note_text = container.find_element(By.CLASS_NAME, "luu_ycc").text.strip()
            match = re.search(r"(\d{2}:\d{2}).*?(\d{2}/\d{2}/\d{4})", note_text)
            if not match:
                logger.warning("%s: could not parse update note: %r", name, note_text)
                return
            date_time_str = f"{match.group(2)} {match.group(1)}"
            updated_at = datetime.strptime(date_time_str, "%d/%m/%Y %H:%M").replace(tzinfo=tz_utc_plus_7)
        except (NoSuchElementException, ValueError) as e:
            logger.warning("%s: could not read listing timestamp: %s", name, e)
            return

        try:
            table = container.find_element(By.TAG_NAME, "table")
            tbody = table.find_element(By.TAG_NAME, "tbody")
        except NoSuchElementException as e:
            logger.warning("%s: rate table not found: %s", name, e)
            return

        rows = tbody.find_elements(By.TAG_NAME, "tr")
        for row in rows:
            try:
                cells = row.find_elements(By.TAG_NAME, "td")
                if len(cells) < 4:
                    continue

                currency_code = cells[0].text.strip()
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
                logger.warning("%s: skipped row: %s", name, e)
                continue

        self.save_to_db(fx_list)
        logger.info("%s: collected %s rate row(s) for DB", name, len(fx_list))
