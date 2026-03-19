import time

from selenium import webdriver
from selenium.webdriver.common.by import By

from scripts.scrapper import Scraper

class YFS(Scraper):
    def __init__(self, driver: webdriver.Edge, website: str) -> None:
        super().__init__(driver)
        self.website = website
        self.financial_stats = {}
    
    def scrape_news(self, ids: dict[str, str]) -> dict[str, dict]:
        return self.financial_stats