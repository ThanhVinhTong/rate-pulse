import os

from utils.folders import init_root_folder, init_subfolder
from utils.sessions import start_driver
from utils.constants import get_output_folder, get_website, get_wms_ids, get_webdriver_path
from utils.dates import handle_publish_date

from scripts.wms import WMS

if __name__ == "__main__":
	# Link info
    website = get_website()
    output_folder = get_output_folder()
    webdriver_path = get_webdriver_path()

    root = init_root_folder(output_folder)
    driver = start_driver(webdriver_path)
    print(f"Driver started successfully")

    wms = WMS(driver, website)
    ids = get_wms_ids()
    news_data = wms.scrape_news(ids)
    print(news_data)