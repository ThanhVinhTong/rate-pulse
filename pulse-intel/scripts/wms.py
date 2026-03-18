import time

from selenium import webdriver
from selenium.webdriver.common.by import By

from scripts.scrapper import Scrapper

class WMS(Scrapper):
    def __init__(self, driver: webdriver.Edge, website: str) -> None:
        super().__init__(driver)
        self.website = website
        self.news_data = {}
        self.ai_insights_classes = {
            "world_brief": "insights-brief-text",
            "geo_insights": ["convergence-zone", "convergence-description"],
            "break_news": "insight-story-title",
        }

    def get_ai_insights(self, id: str) -> dict[str, dict[str, str]]:
        contents = self.driver.find_element(By.ID, id)
        insights = {}

        # Summary fetch
        info = contents.find_element(By.CLASS_NAME, self.ai_insights_classes["world_brief"]).text
        insights["world_brief"] = info
        
        # Geo insights fetch
        region_class, description = self.ai_insights_classes["geo_insights"]
        insights["geo_insights"] = []
        regions = contents.find_elements(By.CLASS_NAME, region_class)
        descriptions = contents.find_elements(By.CLASS_NAME, description)
        for region, description in zip(regions, descriptions):
            insights["geo_insights"].append({region.text: description.text.split(": ")[-1]})
        
        # Break news fetch
        insights["break_news"] = []
        infos = contents.find_elements(By.CLASS_NAME, self.ai_insights_classes["break_news"])
        for info in infos:
            insights["break_news"].append(info.text)
        
        return insights

    def get_intel_feed(self, id: str) -> dict[str, dict[str, str]]:
        contents = self.driver.find_element(By.ID, id)
        intel_feed = {}

        infos = contents.find_elements(By.CLASS_NAME, "item-title")
        times = contents.find_elements(By.CLASS_NAME, "item-time")
        for info, time in zip(infos, times):
            intel, href = info.text, info.get_attribute("href")
            intel_feed[intel] = {
                "href": href,
                "time": time.text
            }
            
        return intel_feed

    def get_section_news(self, id: str) -> dict[str, dict[str, str]]:
        contents = self.driver.find_element(By.ID, id)
        continent_news = {}

        infos = contents.find_elements(By.CLASS_NAME, "item-title")
        times = contents.find_elements(By.CLASS_NAME, "item-time")
        for info, time in zip(infos, times):
            continent_news[info.text] = {
                "href": info.get_attribute("href"),
                "time": time.text
            }
            
        return continent_news

    def scrape_news(self, ids: dict[str, str]) -> dict[str, dict]:
        self.driver.get(self.website)
        print(f"Website loaded successfully {self.website}")

        print(f"Scraping news ...")
        time.sleep(5)

        # Fetch AI insights
        self.news_data["ai_insights"] = self.get_ai_insights(ids["ai_insights"])

        # Fetch intel feed
        self.news_data["intel_feed"] = self.get_intel_feed(ids["intel_feed"])
        
        # Fetch continent news
        self.news_data["world_news"] = self.get_section_news(ids["world_news"])
        self.news_data["united_states"] = self.get_section_news(ids["united_states"])
        self.news_data["europe"] = self.get_section_news(ids["europe"])
        self.news_data["middle_east"] = self.get_section_news(ids["middle_east"])
        self.news_data["africa"] = self.get_section_news(ids["africa"])
        self.news_data["latin_america"] = self.get_section_news(ids["latin_america"])
        self.news_data["asia_pacific"] = self.get_section_news(ids["asia_pacific"])
        self.news_data["energy_and_resources"] = self.get_section_news(ids["energy_and_resources"])
        self.news_data["government"] = self.get_section_news(ids["government"])
        self.news_data["think_tanks"] = self.get_section_news(ids["think_tanks"])


        print("Quitting driver")
        self.driver.quit()

        return self.news_data