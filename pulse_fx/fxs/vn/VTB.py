import logging
from datetime import datetime

from selenium.common.exceptions import NoSuchElementException, WebDriverException
from selenium.webdriver.common.by import By

from constants import get_bank_code, require_bank_constant
from fxs.FX import FX
from utils.checkers import check_currency_data
from utils.numeric_cleaner import clean_symbol, parse_rate

logger = logging.getLogger(__name__)


class VTB(FX):
    def __init__(self, driver, connection, name="vtb"):
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

        try:
            body_outer = self.driver.execute_script("return document.body.outerHTML;")
            # Detect AWS WAF CAPTCHA page and skip
            if any(s in body_outer for s in ("captcha-container", "AwsWafIntegration", "ChallengeScript", "renderCaptcha")):
                logger.error("%s: blocked by AWS WAF CAPTCHA; skipping", name)
                return
                
            # Avoid IndexError from find_elements()[0]
            inputs = self.driver.find_elements(By.TAG_NAME, "input")
            if not inputs:
                logger.warning("%s: no <input> elements found; DOM changed or blocked; skipping", name)
                return
            date_str = (inputs[0].get_attribute("value") or "").strip()

            time_nodes = self.driver.find_elements(By.CLASS_NAME, "react-select__single-value")
            time_str = time_nodes[0].text.strip() if time_nodes else ""
            if date_str and time_str:
                updated_at = datetime.strptime(f"{date_str} {time_str}", "%d/%m/%Y %H:%M:%S").replace(tzinfo=tz_utc_plus_7)
            else:
                updated_at = datetime.now(tz_utc_plus_7)
        except (NoSuchElementException, ValueError) as e:
            updated_at = datetime.now(tz_utc_plus_7)
            logger.warning(
                "%s: date/time parse failed (no FX widget today or DOM change); using fallback now (UTC+7): %s",
                name,
                e,
            )

        try:
            bodies = self.driver.find_elements(By.TAG_NAME, "tbody")
            if not bodies:
                logger.warning("%s: rate table not found", name)
                return
            body = bodies[0]
        except NoSuchElementException as e:
            logger.warning("%s: rate table not found: %s", name, e)
            return

        rows = body.find_elements(By.TAG_NAME, "tr")
        row_error_count = 0
        currency_code = ""
        for row_index, row in enumerate(rows, start=1):
            try:
                cells = row.find_elements(By.TAG_NAME, "td")
                if not cells:
                    continue

                if len(cells) == 3:
                    buy_cheque_val = cells[1].text.strip().replace(".", "").replace(",", ".")
                    rate_val = parse_rate(clean_symbol(buy_cheque_val))
                    if rate_val is not None and currency_code:
                        fx_list.append(
                            {
                                "source_code": "VTB",
                                "source_currency": info["source_currency"],
                                "destination_currency": currency_code,
                                "type_id": translate_column["buy_cheque"],
                                "rate_value": rate_val,
                                "valid_from_date": updated_at,
                            }
                        )
                else:
                    currency_code = cells[0].text.strip()
                    if not currency_code or not check_currency_data(currency_code):
                        continue

                    buy_cash = cells[1].text.strip().replace(".", "").replace(",", ".")
                    buy_transfer = cells[2].text.strip().replace(".", "").replace(",", ".")
                    sell_cash_transfer = cells[3].text.strip().replace(".", "").replace(",", ".")

                    temp_rates = {
                        "buy_cash": parse_rate(clean_symbol(buy_cash)),
                        "buy_transfer": parse_rate(clean_symbol(buy_transfer)),
                        "sell": parse_rate(clean_symbol(sell_cash_transfer)),
                    }

                    self.append_rates(
                        fx_list=fx_list,
                        source_code=name,
                        source_currency=info["source_currency"],
                        destination_currency=currency_code,
                        rates_by_type=temp_rates,
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
