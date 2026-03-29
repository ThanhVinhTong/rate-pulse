import logging
import os
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv

from fxs.script import Script
from utils.cloud_delivery import deliver_run_notifications
from utils.logging_config import configure_logging
from utils.sessions import start_driver

logger = logging.getLogger(__name__)


def _default_log_path() -> str:
    base = os.getcwd()
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    return os.path.join(base, "logs", f"pulse_fx_{ts}.log")


def main() -> int:
    load_dotenv()

    log_file = os.getenv("PULSE_FX_LOG_FILE", "").strip() or _default_log_path()
    configure_logging(log_file=log_file)
    logger.debug("Logging to file: %s", log_file)

    webdriver_path = os.getenv("EDGE_DRIVER_PATH", "./edgedriver_145/msedgedriver.exe")
    db_uri = os.getenv("DB_SOURCE")

    exit_code = 0
    driver = None

    if not db_uri or not str(db_uri).strip():
        logger.error("DB_SOURCE is not set or empty. Set it in the environment or .env.")
        exit_code = 1
        deliver_run_notifications(log_path=log_file, success=False)
        return exit_code

    try:
        driver = start_driver(webdriver_path)
    except Exception:
        logger.exception("Failed to start WebDriver (path=%r)", webdriver_path)
        exit_code = 1
        deliver_run_notifications(log_path=log_file, success=False)
        return exit_code

    logger.info("Driver started successfully")

    try:
        Script(driver, db_uri).get_fx()
    except Exception:
        logger.exception("Fatal error in FX script")
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
