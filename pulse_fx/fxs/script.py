from selenium import webdriver
from fxs.vn.VN import VN

from sqlalchemy.engine import create_engine, Engine

class Script:
    def __init__(self, driver: webdriver.Edge, db_uri: str) -> None:
        self.driver = driver
        self.db_uri = db_uri

    def get_fx(self) -> None:
        connection_engine = create_engine(self.db_uri)
        VN(self.driver, connection_engine).get_fx()