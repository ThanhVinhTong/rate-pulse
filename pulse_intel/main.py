from utils.folders import init_root_folder
from utils.sessions import start_driver
from utils.constants import get_output_folder, get_wms_website, get_wms_ids, get_webdriver_path
from utils.excel_export import export_news_to_excel
from utils.mongodb_export import export_news_to_mongodb

from news.wms import WMS

if __name__ == "__main__":
    # Link info
    website = get_wms_website()
    output_folder = get_output_folder()
    webdriver_path = get_webdriver_path()

    root = init_root_folder(output_folder)
    driver = start_driver(webdriver_path)
    print(f"Driver started successfully")

    wms = WMS(driver, website)
    ids = get_wms_ids()
    news_data = wms.scrape_news(ids)

    # Save to MongoDB or excel or both
    mongodb_id = export_news_to_mongodb(news_data, root)
    print(f"MongoDB snapshot ID: {mongodb_id}")

    excel_path = export_news_to_excel(news_data, root)
    print(f"Excel report saved: {excel_path}")