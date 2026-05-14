import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError

from fxs.vn.ACB import ACB
from fxs.vn.BIDV import BIDV
from fxs.vn.MBB import MBB
from fxs.vn.TCB import TCB
from fxs.vn.VCB import VCB
from fxs.vn.VTB import VTB
from utils.sessions import start_driver

logger = logging.getLogger(__name__)


class Script:
    def __init__(self, *, db_uri: str, webdriver_path: str, max_workers: int = 5) -> None:
        self.db_uri = db_uri
        self.webdriver_path = webdriver_path
        self.max_workers = max(1, max_workers)
        self.bank_classes = [VCB, BIDV, ACB, VTB, MBB, TCB]
        # self.bank_classes = [TCB]

    def get_fx(self) -> None:
        if not self.db_uri or not str(self.db_uri).strip():
            logger.error("DB_SOURCE / db_uri is missing or empty; aborting.")
            return

        try:
            engine = create_engine(self.db_uri)
        except SQLAlchemyError:
            logger.exception("Could not create SQLAlchemy engine (check DB_SOURCE).")
            return
        except Exception:
            logger.exception("Unexpected error creating database engine.")
            return

        worker_count = min(self.max_workers, len(self.bank_classes))
        logger.info("Running %s bank scraper(s) with %s worker(s)", len(self.bank_classes), worker_count)

        try:
            with ThreadPoolExecutor(max_workers=worker_count, thread_name_prefix="fx-bank") as executor:
                futures = {
                    executor.submit(self._run_bank, engine, bank_class): bank_class.__name__
                    for bank_class in self.bank_classes
                }

                for future in as_completed(futures):
                    label = futures[future]
                    try:
                        future.result()
                    except Exception:
                        logger.exception("%s: scraper failed outside guarded bank runner", label)
        finally:
            engine.dispose()

    def _run_bank(self, engine, bank_class) -> None:
        label = bank_class.__name__
        driver = None
        conn = None

        try:
            logger.info("--- Starting %s ---", label)
            driver = start_driver(self.webdriver_path)
            conn = engine.connect()
            bank = bank_class(driver, conn)
            bank.get_fx()
            logger.info("--- Finished %s ---", label)
        except Exception:
            logger.exception("%s: unhandled error; rolling back and continuing", label)
            if conn is not None:
                try:
                    conn.rollback()
                except SQLAlchemyError:
                    logger.warning("%s: rollback after failure also failed", label)
        finally:
            if conn is not None:
                conn.close()
            if driver is not None:
                try:
                    driver.quit()
                except Exception as e:
                    logger.warning("%s: driver.quit() failed: %s", label, e)
