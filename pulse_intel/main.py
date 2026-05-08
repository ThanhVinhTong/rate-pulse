import logging
import os
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv

from utils.cloud_delivery import deliver_run_notifications
from utils.folders import init_root_folder
from utils.logging_config import configure_logging
from utils.sessions import start_driver
from utils.constants import get_output_folder, get_wms_website, get_wms_ids, get_webdriver_path
from utils.excel_export import export_news_to_excel
from utils.mongodb_export import export_news_to_mongodb

from news.wms import WMS

logger = logging.getLogger(__name__)


def _default_log_path() -> str:
    base = os.getcwd()
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    return os.path.join(base, "logs", f"pulse_intel_{ts}.log")


def main() -> int:
    load_dotenv()

    log_file = os.getenv("PULSE_INTEL_LOG_FILE", "").strip() or _default_log_path()
    configure_logging(log_file=log_file)
    logger.debug("Logging to file: %s", log_file)

    # Link info
    website = get_wms_website()
    output_folder = get_output_folder()
    webdriver_path = get_webdriver_path()

    exit_code = 0
    driver = None

    try:
        root = init_root_folder(output_folder)
        driver = start_driver(webdriver_path)
        logger.info("Driver started successfully")

        wms = WMS(driver, website)
        ids = get_wms_ids()
        news_data = wms.scrape_news(ids)

        # Save to MongoDB or excel or both
        mongodb_id = export_news_to_mongodb(news_data, root)
        logger.info("MongoDB snapshot ID: %s", mongodb_id)

        excel_path = export_news_to_excel(news_data, root)
        logger.info("Excel report saved: %s", excel_path)
    except Exception:
        logger.exception("Fatal error in pulse_intel script")
        exit_code = 1
    finally:
        if driver is not None:
            try:
                driver.quit()
            except Exception as e:
                logger.warning("driver.quit() failed: %s", e)
            else:
                logger.info("Driver closed")

    deliver_run_notifications(log_path=log_file, success=(exit_code == 0))
    return exit_code


if __name__ == "__main__":
    sys.exit(main())