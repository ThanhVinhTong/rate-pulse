from constants.Constant import Constant

class ACBBank(Constant):
    def __init__(self):
        self.website = "https://acb.com.vn/ty-gia-hoi-doai"
        self.info = {
            "source_currency": "VND",
            "destination_currency": "currency_code",
            "buy_cash": "buy_cash",
            "buy_transfer": "buy_transfer",
            "sell_cash": "sell_cash",
            "sell_transfer": "sell_transfer",
            "time_zone": "UTC+7",
            "updated_at": "updated_at"
        }

        self.translate_column = {
            "buy_cash": 1,
            "buy_transfer": 3,
            "sell_cash": 2,
            "sell_transfer": 4
        }

    def get_website(self) -> str:
        return self.website

    def get_info(self) -> dict:
        return self.info

    def get_translate_column(self) -> dict:
        return self.translate_column