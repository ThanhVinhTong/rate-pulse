import os
import platform

from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.edge.service import Service as EdgeService

def start_driver(webdriver_path=None):
    is_linux = platform.system() == 'Linux'

    if is_linux:
        # On Linux (e.g. GitHub Actions ubuntu-latest), Chrome is pre-installed.
        # We rely on Selenium Manager to set up the driver automatically.
        options = ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('--disable-infobars')
        options.add_argument('--start-maximized')
        options.add_argument('--window-size=1280,900')
        options.add_argument('--incognito')
        options.add_argument('--log-level=3')
        options.add_experimental_option('excludeSwitches', ['enable-automation', 'enable-logging'])
        options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36')
        
        service = ChromeService(log_output=os.devnull)
        driver = webdriver.Chrome(service=service, options=options)
    else:
        # On Windows, preserve Edge usage
        edge_options = EdgeOptions()
        edge_options.add_argument('--headless')
        edge_options.add_argument('--no-sandbox')
        edge_options.add_argument('--disable-dev-shm-usage')
        edge_options.add_argument('--disable-blink-features=AutomationControlled')
        edge_options.add_argument('--disable-infobars')
        edge_options.add_argument('--start-maximized')
        edge_options.add_argument('--window-size=1280,900')
        edge_options.add_argument('--inprivate')
        edge_options.add_argument('--log-level=3')
        edge_options.add_argument('--disable-features=msEdgePictureInPicture')
        edge_options.add_experimental_option('excludeSwitches', ['enable-automation', 'enable-logging'])
        edge_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36')

        if webdriver_path and os.path.exists(webdriver_path):
            service = EdgeService(executable_path=webdriver_path, log_output=os.devnull)
        else:
            service = EdgeService(log_output=os.devnull)
            
        driver = webdriver.Edge(service=service, options=edge_options)

    # Best-effort to reduce webdriver detectability
    try:
        driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
        })
    except Exception:
        pass

    return driver