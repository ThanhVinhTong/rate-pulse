from constants.Constant import Constant


class CBAConstant(Constant):
    def __init__(self):
        self.website = "https://www.commbank.com.au/international/foreign-exchange-rates.html"
        self.info = {
            "source_currency": "AUD",
            "destination_currency": "currency_code",
            "send_imt": "send_imt",
            "receive_imt": "receive_imt",
            "load_currency_to_tmc": "load_currency_to_tmc",
            "unload_currency_from_tmc": "unload_currency_from_tmc",
            "get_foreign_cash": "get_foreign_cash",
            "change_foreign_cash": "change_foreign_cash",
            "time_zone": "AEST",
            "updated_at": "updated_at",
        }

        self.translate_column = {
            "send_imt": 11,
            "receive_imt": 12,
            "load_currency_to_tmc": 7,
            "unload_currency_from_tmc": 8,
            "get_foreign_cash": 10,
            "change_foreign_cash": 9,
        }

    def get_website(self) -> str:
        return self.website

    def get_info(self) -> dict:
        return self.info

    def get_translate_column(self) -> dict:
        return self.translate_column
