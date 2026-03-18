from selenium import webdriver

class Scrapper:
    def __init__(self, driver: webdriver.Edge) -> None:
        self.driver = driver
    
    def scrap_news(self) -> None:
        pass