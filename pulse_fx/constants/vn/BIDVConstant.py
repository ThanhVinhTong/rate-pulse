from constants.Constant import Constant

class BIDVConstant(Constant):
    def __init__(self):
        self.website = "https://bidv.com.vn/vn/ty-gia-ngoai-te"
        self.info = {
            "source_currency": "VND",
            "destination_currency": "currency_code",
            "buy_cash_cheque": "buy_cash_cheque",
            "buy_transfer": "buy_transfer",
            "sell_cash_transfer": "sell_cash_transfer",
            "time_zone": "UTC+7",
            "updated_at": "updated_at"
        }

        self.translate_column = {
            "buy_cash_cheque": 10,
            "buy_transfer": 3,
            "sell_cash_transfer": 9
        }

    def get_website(self) -> str:
        return self.website

    def get_info(self) -> dict:
        return self.info

    def get_translate_column(self) -> dict:
        return self.translate_column