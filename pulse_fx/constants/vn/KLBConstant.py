from constants.Constant import Constant


class KLBConstant(Constant):
    def __init__(self):
        self.website = "https://laisuat.kienlongbank.com/PageTyGia.aspx"
        self.info = {
            "source_currency": "VND",
            "destination_currency": "currency_code",
            "buy_cash": "buy_cash",
            "buy_transfer": "buy_transfer",
            "sell_cash_transfer": "sell_cash_transfer",
            "time_zone": "UTC+7",
            "updated_at": "updated_at",
        }

        self.translate_column = {
            "buy_cash": 1,
            "buy_transfer": 3,
            "sell_cash_transfer": 9,
        }

    def get_website(self) -> str:
        return self.website

    def get_info(self) -> dict:
        return self.info

    def get_translate_column(self) -> dict:
        return self.translate_column
