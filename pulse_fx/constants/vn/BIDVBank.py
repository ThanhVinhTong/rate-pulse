from constants.Constant import Constant

class BIDVBank(Constant):
    def __init__(self):
        self.website = "https://bidv.com.vn/vn/ty-gia-ngoai-te"
        self.info = {
            "source_currency": "source_currency",
            "destination_currency": "currency_code",
            "buy_cash": "buy-cash",
            "buy_transfer": "buy-transfer",
            "sell_cash": "sell-cash",
            "sell_transfer": "sell-transfer",
            "buy_cheque": "buy-cheque",
            "time_zone": "UTC+7",
            "updated_at": "updated_at"
        }

    def get_website(self) -> str:
        return self.website

    def get_info(self) -> dict:
        return self.info