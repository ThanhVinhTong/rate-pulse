import logging
import os
import sys

from dotenv import load_dotenv

from fxs.script import Script
from utils.logging_config import configure_logging
from utils.sessions import start_driver

logger = logging.getLogger(__name__)


def main() -> None:
    load_dotenv()
    configure_logging()

    webdriver_path = os.getenv("EDGE_DRIVER_PATH", "./edgedriver_145/msedgedriver.exe")
    db_uri = os.getenv("SUPABASE_URI")

    if not db_uri or not str(db_uri).strip():
        logger.error("SUPABASE_URI is not set or empty. Set it in the environment or .env.")
        sys.exit(1)

    driver = None
    try:
        driver = start_driver(webdriver_path)
    except Exception:
        logger.exception("Failed to start WebDriver (path=%r)", webdriver_path)
        sys.exit(1)

    logger.info("Driver started successfully")

    try:
        Script(driver, db_uri).get_fx()
    except Exception:
        logger.exception("Fatal error in FX script")
        sys.exit(1)
    finally:
        if driver is not None:
            try:
                driver.quit()
            except Exception as e:
                logger.warning("driver.quit() failed: %s", e)
            else:
                logger.info("Driver closed")


if __name__ == "__main__":
    main()