from constants.Constant import Constant

class VietinBank(Constant):
    def __init__(self):
        self.website = "https://www.vietinbank.vn/ca-nhan/ty-gia-khcn"
        self.info = {
            "source_currency": "VND",
            "destination_currency": "currency_code",
            "buy_cash": "buy-cash",
            "buy_transfer": "buy-transfer",
            "buy_cheque": "buy-cheque",
            "sell_cash": "sell-cash",
            "sell_transfer": "sell-transfer",
            "time_zone": "UTC+7",
            "updated_at": "updated_at"
        }

    def get_website(self) -> str:
        return self.website

    def get_info(self) -> dict:
        return self.info