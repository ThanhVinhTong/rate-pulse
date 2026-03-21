from selenium import webdriver
from pulse_fx.fxs.vn.vn import VN


class Script:
    def __init__(self, driver: webdriver.Edge) -> None:
        self.driver = driver

    def get_fx(self) -> dict[str, dict[str, str]]:
        vcb = VN(self.driver, "vcb")
        return vcb.get_fx()