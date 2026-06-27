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
            "geo_insights": ["convergence-region", "convergence-description"],
            "break_news": "insight-story-title",
        }

    def scroll_to_panel(self, panel_name: str, check_class: str = None) -> None:
        try:
            p = self.driver.find_element(By.XPATH, f"//div[@data-panel='{panel_name}']")
            self.driver.execute_script("arguments[0].scrollIntoView({behavior: 'instant', block: 'center'});", p)
            time.sleep(0.3)
            if check_class:
                WebDriverWait(self.driver, 10).until(
                    lambda d: len(d.find_element(By.XPATH, f"//div[@data-panel='{panel_name}']").find_elements(By.CLASS_NAME, check_class)) > 0
                )
        except Exception as e:
            logger.warning("Could not hydrate panel %s: %s", panel_name, e)

    def get_ai_insights(self, id: str) -> dict[str, dict[str, str]]:
        contents = self.driver.find_element(By.ID, id)
        insights = {}

        # Summary fetch
        info = self.driver.execute_script(
            "return arguments[0].querySelector('.' + arguments[1])?.innerText || '';", 
            contents, self.ai_insights_classes["world_brief"]
        )
        insights["world_brief"] = info
        
        # Geo insights fetch
        region_class, description = self.ai_insights_classes["geo_insights"]
        geo_data = self.driver.execute_script("""
            var regions = arguments[0].getElementsByClassName(arguments[1]);
            var descs = arguments[0].getElementsByClassName(arguments[2]);
            var list = [];
            for (var i = 0; i < Math.min(regions.length, descs.length); i++) {
                list.push({
                    region: regions[i].innerText,
                    desc: descs[i].innerText
                });
            }
            return list;
        """, contents, region_class, description)
        
        insights["geo_insights"] = []
        for item in geo_data:
            insights["geo_insights"].append({item["region"]: item["desc"].split(": ")[-1]})
        
        # Break news fetch
        break_news_texts = self.driver.execute_script("""
            var elements = arguments[0].getElementsByClassName(arguments[1]);
            var list = [];
            for (var i = 0; i < elements.length; i++) {
                list.push(elements[i].innerText);
            }
            return list;
        """, contents, self.ai_insights_classes["break_news"])
        insights["break_news"] = break_news_texts
        
        return insights

    def get_section_news(self, id: str) -> dict[str, dict[str, str]]:
        contents = self.driver.find_element(By.ID, id)
        
        news_items = self.driver.execute_script("""
            var infos = arguments[0].getElementsByClassName('item-title');
            var times = arguments[0].getElementsByClassName('item-time');
            var list = [];
            for (var i = 0; i < Math.min(infos.length, times.length); i++) {
                list.push({
                    text: infos[i].innerText,
                    href: infos[i].getAttribute('href'),
                    time: times[i].innerText
                });
            }
            return list;
        """, contents)
        
        continent_news = {}
        for item in news_items:
            continent_news[item["text"]] = {
                "href": item["href"],
                "time": item["time"]
            }
            
        return continent_news

    def get_feed_news(self, id: str) -> dict[str, dict[str, str]]:
        contents = self.driver.find_element(By.ID, id)
        
        feed_items = self.driver.execute_script("""
            var cards = arguments[0].getElementsByClassName('item');
            var list = [];
            for (var i = 0; i < cards.length; i++) {
                var card = cards[i];
                var sourceEl = card.getElementsByClassName('item-source')[0];
                var titleEl = card.getElementsByClassName('item-title')[0];
                if (titleEl) {
                    list.push({
                        title: titleEl.innerText,
                        href: titleEl.getAttribute('href'),
                        source: sourceEl ? sourceEl.innerText : "",
                        isAlert: card.classList.contains('alert')
                    });
                }
            }
            return list;
        """, contents)
        
        financial_news = {}
        read = set()
        
        # First process alert cards to maintain priority logic
        for item in feed_items:
            if item["isAlert"]:
                financial_news[item["title"]] = {
                    "source": item["source"],
                    "href": item["href"]
                }
                read.add(item["title"])
                
        # Then process normal cards
        for item in feed_items:
            if item["title"] in read:
                continue
            financial_news[item["title"]] = {
                "source": item["source"],
                "href": item["href"]
            }
            read.add(item["title"])
            
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

        dashboard_url = self.website.rstrip("/") + "/dashboard"
        logger.info("Navigating directly to: %s", dashboard_url)
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

        # 2. Check if the AI insights brief is present. If not, select Crisis Desk from workspace modal.
        try:
            WebDriverWait(self.driver, 5).until(
                EC.presence_of_element_located((By.CLASS_NAME, self.ai_insights_classes["world_brief"]))
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

        # 3. Final wait for the AI insights brief to load
        WebDriverWait(self.driver, 20).until(
            EC.presence_of_element_located((By.CLASS_NAME, self.ai_insights_classes["world_brief"]))
        )

        # Fetch AI insights
        self.scroll_to_panel("insights", self.ai_insights_classes["world_brief"])
        self.news_data["ai_insights"] = self.get_ai_insights(ids["ai_insights"])

        # Fetch intel feed
        self.scroll_to_panel("intel", "item-title")
        self.news_data["intel_feed"] = self.get_feed_news(ids["intel_feed"])
        
        # Fetch continent news
        self.scroll_to_panel("politics", "item-title")
        self.news_data["world_news"] = self.get_section_news(ids["world_news"])
        
        self.scroll_to_panel("us", "item-title")
        self.news_data["united_states"] = self.get_section_news(ids["united_states"])
        
        self.scroll_to_panel("europe", "item-title")
        self.news_data["europe"] = self.get_section_news(ids["europe"])
        
        self.scroll_to_panel("middleeast", "item-title")
        self.news_data["middle_east"] = self.get_section_news(ids["middle_east"])
        
        self.scroll_to_panel("africa", "item-title")
        self.news_data["africa"] = self.get_section_news(ids["africa"])
        
        self.scroll_to_panel("latam", "item-title")
        self.news_data["latin_america"] = self.get_section_news(ids["latin_america"])
        
        self.scroll_to_panel("asia", "item-title")
        self.news_data["asia_pacific"] = self.get_section_news(ids["asia_pacific"])
        
        self.scroll_to_panel("energy", "item-title")
        self.news_data["energy_and_resources"] = self.get_section_news(ids["energy_and_resources"])
        
        self.scroll_to_panel("gov", "item-title")
        self.news_data["government"] = self.get_section_news(ids["government"])
        
        self.scroll_to_panel("thinktanks", "item-title")
        self.news_data["think_tanks"] = self.get_section_news(ids["think_tanks"])

        # Fetch financial news
        self.scroll_to_panel("finance", "item-title")
        self.news_data["financial"] = self.get_feed_news(ids["financial"])

        return self.news_data