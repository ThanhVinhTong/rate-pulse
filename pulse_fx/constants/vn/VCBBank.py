from constants.Constant import Constant

class VCBBank(Constant):
    def __init__(self):
        self.website = "https://www.vietcombank.com.vn/vi-VN/khcn/Cong-cu-Tien-ich/Ty-gia"
        self.info = {
            "source_currency": "VND",
            "destination_currency": "currency_code",
            "buy_cash": "buy-cash",
            "buy_transfer": "buy-transfer",
            "sell_cash_transfer": "sell",
            "time_zone": "UTC+7",
            "updated_at": "updated_at"
        }
        self.translate_column = {
            "buy-cash": 1,
            "buy-transfer": 3,
            "sell": 9
        }

    def get_website(self) -> str:
        return self.website

    def get_info(self) -> dict:
        return self.info

    def get_translate_column(self) -> dict:
        return self.translate_column