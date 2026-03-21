from pulse_fx.constants.Constant import Constant

class VCBBank(Constant):
    def __init__(self):
        self.website = "https://www.vietcombank.com.vn/vi-VN/khcn/Cong-cu-Tien-ich/Ty-gia"
        self.elements_info = {
            "fx_table": ("CLASS_NAME", "table-wrapper"),
            "fx_table_header": ("TAG", "thead"),
            "fx_table_body": ("TAG", "tbody"),
            "fx_table_row": ("TAG", "tr"),
            "fx_table_cell": ("TAG", "td"),
        }

    def get_website(self) -> str:
        return self.website

    def get_elements_info(self) -> dict:
        return self.elements_info