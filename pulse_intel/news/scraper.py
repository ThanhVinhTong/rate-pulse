from selenium import webdriver

class Scraper:
    def __init__(self, driver: webdriver.Edge) -> None:
        self.driver = driver
    
    def scrape_news(self) -> dict[str, dict[str, str]]:
        pass