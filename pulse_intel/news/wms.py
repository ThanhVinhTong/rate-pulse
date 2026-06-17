import time
import logging

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from news.scraper import Scraper

logger = logging.getLogger(__name__)

class WMS(Scraper):
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

    def get_feed_news(self, id: str) -> dict[str, dict[str, str]]:
        contents = self.driver.find_element(By.ID, id)
        financial_news = {}
        read = set()

        alert_cards = contents.find_elements(By.CLASS_NAME, "item.alert")
        for card in alert_cards:
            source = card.find_element(By.CLASS_NAME, "item-source").text
            title = card.find_element(By.CLASS_NAME, "item-title").text
            href = card.find_element(By.CLASS_NAME, "item-title").get_attribute("href")
            financial_news[title] = {
                "source": source,
                "href": href,
            }
            read.add(title)
        normal_cards = contents.find_elements(By.CLASS_NAME, "item")
        for card in normal_cards:
            title = card.find_element(By.CLASS_NAME, "item-title").text
            if title in read:
                continue
            source = card.find_element(By.CLASS_NAME, "item-source").text
            href = card.find_element(By.CLASS_NAME, "item-title").get_attribute("href")
            financial_news[title] = { "source": source, "href": href }
            read.add(title)
            
        return financial_news

    def scrape_news(self, ids: dict[str, str]) -> dict[str, dict]:
        # Force desktop window size to guarantee desktop layout elements render
        try:
            self.driver.set_window_size(1920, 1080)
        except Exception:
            try:
                self.driver.maximize_window()
            except Exception:
                pass

        self.driver.get(self.website)
        
        # If the page did not auto-redirect to the dashboard, navigate there directly
        time.sleep(2)
        if "/dashboard" not in self.driver.current_url:
            dashboard_url = self.website.rstrip("/") + "/dashboard"
            logger.info("Not on dashboard. Navigating directly to: %s", dashboard_url)
            self.driver.get(dashboard_url)

        logger.info("Website loaded successfully: %s", self.driver.current_url)
        logger.info("Scraping news ...")

        # 1. Wait for the page/dashboard buttons to render (either modal or header MISSION button)
        try:
            WebDriverWait(self.driver, 15).until(
                lambda d: any(
                    "Crisis Desk" in b.text or b.get_attribute("id") == "missionPresetBtn"
                    for b in d.find_elements(By.TAG_NAME, "button")
                )
            )
        except Exception:
            pass

        # 2. Check if the AI insights container is present. If not, select Crisis Desk from workspace modal.
        try:
            WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.ID, ids["ai_insights"]))
            )
        except Exception:
            logger.info("AI Insights element not found immediately. Attempting to select Crisis Desk workspace...")
            try:
                # 1. If Crisis Desk is already visible (modal is open on load), click it
                logger.debug("Checking if 'Crisis Desk' button is already visible (modal open on load)...")
                crisis_btn = WebDriverWait(self.driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Crisis Desk')]"))
                )
                crisis_btn.click()
                logger.debug("Clicked visible 'Crisis Desk' button. Waiting 1s...")
                time.sleep(1)
                # Dismiss the modal by clicking Close
                close_btn = WebDriverWait(self.driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Close')]"))
                )
                close_btn.click()
                logger.debug("Clicked 'Close' button. Waiting 1s...")
                time.sleep(1)
            except Exception as e:
                logger.debug("Modal was not open on load (or error clicking visible buttons): %s. Proceeding to open modal...", e)
                # 2. If Crisis Desk button wasn't present, the modal is closed. Open it via missionPresetBtn.
                try:
                    logger.debug("Attempting to locate and click 'missionPresetBtn'...")
                    mission_btn = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.ID, "missionPresetBtn"))
                    )
                    mission_btn.click()
                    logger.debug("Clicked 'missionPresetBtn'. Waiting 1.5s for modal to render...")
                    time.sleep(1.5)
                    
                    logger.debug("Attempting to locate and click 'Crisis Desk' button inside modal...")
                    crisis_btn = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Crisis Desk')]"))
                    )
                    crisis_btn.click()
                    logger.debug("Clicked 'Crisis Desk' button. Waiting 1s...")
                    time.sleep(1)
                    
                    logger.debug("Attempting to locate and click 'Close' button inside modal...")
                    close_btn = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Close')]"))
                    )
                    close_btn.click()
                    logger.debug("Clicked 'Close' button. Waiting 1s...")
                    time.sleep(1)
                except Exception as ex:
                    logger.exception("Warning: Could not select Crisis Desk workspace")

        # 3. Final wait for the AI insights container to load
        WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.ID, ids["ai_insights"]))
        )

        # Fetch AI insights
        self.news_data["ai_insights"] = self.get_ai_insights(ids["ai_insights"])

        # Fetch intel feed
        self.news_data["intel_feed"] = self.get_feed_news(ids["intel_feed"])
        
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

        # Fetch financial news
        self.news_data["financial"] = self.get_feed_news(ids["financial"])

        return self.news_data