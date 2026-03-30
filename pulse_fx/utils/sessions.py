import logging
import os
import platform

from selenium import webdriver
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.edge.service import Service as EdgeService

logger = logging.getLogger(__name__)


def start_driver(webdriver_path):
    is_linux = platform.system() == "Linux"
    
    if is_linux:
        # On Render/Linux, we prefer Chrome for reliability
        options = ChromeOptions()
        options.add_argument('--headless=new')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--window-size=1280,900')
        # options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36')
        
        # In Docker, we usually don't need to specify executable_path if it's in /usr/bin/
        # but Render/Docker setup will place it where we define it.
        if os.path.exists(webdriver_path):
            service = ChromeService(executable_path=webdriver_path)
        else:
            service = ChromeService() # assumes it's in PATH
            
        try:
            driver = webdriver.Chrome(service=service, options=options)
        except WebDriverException:
            logger.exception("Chrome WebDriver failed to start (Linux)")
            raise
    else:
        # Local Windows setup (Edge)
        options = EdgeOptions()
        options.add_argument('--headless=new')
        options.add_argument('--enable-javascript')
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--start-maximized')
        options.add_argument('--window-size=1280,900')
        options.add_argument('--inprivate')
        options.add_argument('--log-level=3')
        options.add_experimental_option('excludeSwitches', ['enable-automation', 'enable-logging'])
        options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36')
        
        service = EdgeService(executable_path=webdriver_path)
        try:
            driver = webdriver.Edge(service=service, options=options)
        except WebDriverException:
            logger.exception("Edge WebDriver failed to start (path=%r)", webdriver_path)
            raise

    # Best-effort to reduce webdriver detectability
    try:
        driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
        })
    except Exception:
        pass

    return driver