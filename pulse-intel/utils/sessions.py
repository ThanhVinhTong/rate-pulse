import os

from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.edge.service import Service

def start_driver(webdriver_path):
    edge_options = Options()
    edge_options.add_argument('--headless')  # Disable headless for interactive login reliability
    edge_options.add_argument('--no-sandbox')
    edge_options.add_argument('--disable-dev-shm-usage')
    edge_options.add_argument('--disable-blink-features=AutomationControlled')
    edge_options.add_argument('--disable-infobars')
    edge_options.add_argument('--start-maximized')
    edge_options.add_argument('--window-size=1280,900')
    edge_options.add_argument('--inprivate')  # Enable Incognito mode
    edge_options.add_argument('--log-level=3')
    edge_options.add_argument('--disable-features=msEdgePictureInPicture')
    edge_options.add_experimental_option('excludeSwitches', ['enable-automation', 'enable-logging'])
    # edge_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36')

    service = Service(executable_path=webdriver_path, log_output=os.devnull)

    driver = webdriver.Edge(service=service, options=edge_options)
    # Best-effort to reduce webdriver detectability
    try:
        driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': "Object.defineProperty(navigator, 'webdriver', {get: () => undefined});"
        })
    except Exception:
        pass

    return driver