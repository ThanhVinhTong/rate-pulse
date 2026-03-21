from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from pulse_fx.fxs.FX import FX
from pulse_fx.constants import get_bank_constant


class VN(FX):
    def __init__(self, driver: webdriver.Edge, bank_name: str) -> None:
        self.driver = driver
        self.bank_name = bank_name
        self.bank_constant = get_bank_constant(bank_name)

    def get_fx(self) -> dict[str, dict[str, str]]:
        website = self.bank_constant.get_website()
        elements = self.bank_constant.get_elements_info()

        # Map constant keys to Selenium By
        by_map = {
            "CLASS_NAME": By.CLASS_NAME,
            "TAG": By.TAG_NAME,
        }

        self.driver.get(website)

        fx_table_by, fx_table_value = elements["fx_table"]
        wrapper = WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((by_map[fx_table_by], fx_table_value))
        )

        header_by, header_value = elements["fx_table_header"]
        body_by, body_value = elements["fx_table_body"]
        row_by, row_value = elements["fx_table_row"]
        cell_by, cell_value = elements["fx_table_cell"]

        thead = wrapper.find_element(by_map[header_by], header_value)
        tbody = wrapper.find_element(by_map[body_by], body_value)

        # Headers: ["Mã ngoại tệ", "Tên ngoại tệ", "Mua tiền mặt", "Mua chuyển khoản", "Bán"]
        header_row = thead.find_element(By.TAG_NAME, "tr")
        headers = [h.text.strip().replace("\n", " ") for h in header_row.find_elements(By.TAG_NAME, "th")]

        fx_data: dict[str, dict[str, str]] = {}
        rows = tbody.find_elements(by_map[row_by], row_value)

        for row in rows:
            cells = row.find_elements(by_map[cell_by], cell_value)
            if len(cells) < 5:
                continue

            # First cell includes flag + code; keep last token (e.g. "USD")
            code_raw = cells[0].text.strip()
            currency_code = code_raw.split()[-1] if code_raw else ""

            currency_name = cells[1].text.strip()
            buy_cash = cells[2].text.strip()
            buy_transfer = cells[3].text.strip()
            sell = cells[4].text.strip()

            if not currency_code:
                continue

            fx_data[currency_code] = {
                "currency_name": currency_name,
                "buy_cash": buy_cash,
                "buy_transfer": buy_transfer,
                "sell": sell,
                "raw_columns": dict(zip(headers, [c.text.strip() for c in cells])),
            }

        return fx_data