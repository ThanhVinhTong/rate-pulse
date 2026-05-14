import os
import sys
from datetime import datetime, timezone
import logging

from dotenv import load_dotenv

from fxs.script import Script
from utils.cloud_delivery import deliver_run_notifications
from utils.logging_config import configure_logging

logger = logging.getLogger(__name__)


def _default_log_path() -> str:
    base = os.getcwd()
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    return os.path.join(base, "logs", f"pulse_fx_{ts}.log")


def _env_int(name: str, default: int) -> int:
    raw_value = os.getenv(name, "").strip()
    if not raw_value:
        return default
    try:
        return int(raw_value)
    except ValueError:
        logger.warning("%s=%r is not an integer; using %s", name, raw_value, default)
        return default


def main() -> int:
    load_dotenv()

    log_file = os.getenv("PULSE_FX_LOG_FILE", "").strip() or _default_log_path()
    configure_logging(log_file=log_file)
    logger.debug("Logging to file: %s", log_file)

    webdriver_path = os.getenv("EDGE_DRIVER_PATH", "./edgedriver_145/msedgedriver.exe")
    max_workers = _env_int("PULSE_FX_MAX_WORKERS", 3)
    db_uri = os.getenv("DB_SOURCE")

    exit_code = 0

    if not db_uri or not str(db_uri).strip():
        logger.error("DB_SOURCE is not set or empty. Set it in the environment or .env.")
        exit_code = 1
        deliver_run_notifications(log_path=log_file, success=False)
        return exit_code

    try:
        Script(db_uri=db_uri, webdriver_path=webdriver_path, max_workers=max_workers).get_fx()
    except Exception:
        logger.exception("Fatal error in FX script")
        exit_code = 1

    deliver_run_notifications(log_path=log_file, success=(exit_code == 0))
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
