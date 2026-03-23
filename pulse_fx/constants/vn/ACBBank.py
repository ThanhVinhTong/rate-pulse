from constants.Constant import Constant

class ACBBank(Constant):
    def __init__(self):
        self.website = "https://acb.com.vn/ty-gia-hoi-doai"
        self.info = {
            "source_currency": "VND",
            "destination_currency": "currency_code",
            "buy_cash": "buy-cash",
            "buy_transfer": "buy-transfer",
            "sell_cash": "sell-cash",
            "sell_transfer": "sell-transfer",
            "time_zone": "UTC+7",
            "updated_at": "updated_at"
        }

    def get_website(self) -> str:
        return self.website

    def get_info(self) -> dict:
        return self.info