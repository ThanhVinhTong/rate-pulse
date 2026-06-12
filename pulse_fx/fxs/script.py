import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError

from fxs.vn.ACB import ACB
from fxs.vn.Agribank import Agribank
from fxs.vn.BIDV import BIDV
from fxs.vn.BaoViet import BaoViet
from fxs.vn.Eximbank import Eximbank
from fxs.vn.GPBank import GPBank
from fxs.vn.HSBCVN import HSBCVN
from fxs.vn.KLB import KLB
from fxs.au.CBA import CBA
from fxs.vn.MBB import MBB
from fxs.vn.TCB import TCB
from fxs.vn.TPB import TPB
from fxs.vn.VCB import VCB
from fxs.vn.VTB import VTB
from utils.sessions import start_driver

logger = logging.getLogger(__name__)

BANK_NAMES = {
    BaoViet: "baoviet",
    ACB: "acb",
    Agribank: "agribank",
    Eximbank: "eximbank",
    GPBank: "gpbank",
    CBA: "cba",
    BIDV: "bidv",
    MBB: "mbb",
    TCB: "tcb",
    HSBCVN: "hsbcvn",
    KLB: "klb",
    TPB: "tpb",
    VCB: "vcb",
    VTB: "vtb",
}


class Script:
    def __init__(self, *, db_uri: str, webdriver_path: str, max_workers: int = 5) -> None:
        self.db_uri = db_uri
        self.webdriver_path = webdriver_path
        self.max_workers = max(1, max_workers)
        self.bank_classes = [VCB, BaoViet, Eximbank, GPBank, CBA, BIDV, ACB, VTB, MBB, TCB, Agribank, HSBCVN, TPB, KLB]

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
        results_by_bank: dict[type, dict] = {}

        try:
            with ThreadPoolExecutor(max_workers=worker_count, thread_name_prefix="fx-bank") as executor:
                futures = {
                    executor.submit(self._run_bank, engine, bank_class): bank_class
                    for bank_class in self.bank_classes
                }

                for future in as_completed(futures):
                    bank_class = futures[future]
                    label = bank_class.__name__
                    try:
                        results_by_bank[bank_class] = future.result()
                    except Exception as e:
                        logger.exception("%s: scraper failed outside guarded bank runner", label)
                        results_by_bank[bank_class] = self._failure_summary(
                            bank_class=bank_class,
                            place="future result",
                            error=e,
                        )

            self._log_run_summary(results_by_bank)
        finally:
            engine.dispose()

    def _run_bank(self, engine, bank_class) -> dict:
        bank_name = BANK_NAMES[bank_class]
        label = bank_class.__name__
        driver = None
        conn = None
        bank = None

        try:
            logger.info("--- Starting %s ---", label)
            driver = start_driver(self.webdriver_path)
            conn = engine.connect()
            bank = bank_class(driver, conn, bank_name)
            bank.get_fx()
            logger.info("--- Finished %s ---", label)
            summary = dict(bank.last_scrape_summary)
            summary["bank"] = summary.get("bank") or label
            return summary
        except Exception as e:
            logger.exception(
                "%s: status=FAILED | bank_name=%s | place=bank runner | error=%s",
                label,
                bank_name,
                e,
            )
            if conn is not None:
                try:
                    conn.rollback()
                except SQLAlchemyError:
                    logger.warning("%s: rollback after failure also failed", label)
            if bank is not None:
                bank.log_scrape_failure(name=getattr(bank, "code", label), place="bank runner", error=e)
                return dict(bank.last_scrape_summary)
            return self._failure_summary(bank_class=bank_class, place="bank runner", error=e)
        finally:
            if conn is not None:
                conn.close()
            if driver is not None:
                try:
                    driver.quit()
                except Exception as e:
                    logger.warning("%s: driver.quit() failed: %s", label, e)

    def _failure_summary(self, *, bank_class, place: str, error: Exception | str) -> dict:
        return {
            "bank": bank_class.__name__,
            "status": "FAILED",
            "link_records": 0,
            "extracted_records": 0,
            "inserted_records": 0,
            "duplicate_records": 0,
            "db_failed_records": 0,
            "parse_failed_records": 0,
            "place": place,
            "error": str(error),
        }

    def _log_run_summary(self, results_by_bank: dict[type, dict]) -> None:
        headers = (
            "Bank",
            "Status",
            "Link",
            "Extracted",
            "Inserted",
            "Duplicate",
            "DB Fail",
            "Parse Fail",
        )
        rows = []
        for bank_class in self.bank_classes:
            summary = results_by_bank.get(
                bank_class,
                self._failure_summary(
                    bank_class=bank_class,
                    place="missing result",
                    error="bank did not return a result",
                ),
            )
            rows.append(
                (
                    str(summary.get("bank") or bank_class.__name__),
                    str(summary.get("status", "FAILED")),
                    str(summary.get("link_records", 0)),
                    str(summary.get("extracted_records", 0)),
                    str(summary.get("inserted_records", 0)),
                    str(summary.get("duplicate_records", 0)),
                    str(summary.get("db_failed_records", 0)),
                    str(summary.get("parse_failed_records", 0)),
                )
            )

        widths = [
            max(len(headers[index]), *(len(row[index]) for row in rows))
            for index in range(len(headers))
        ]
        header_line = " | ".join(headers[index].ljust(widths[index]) for index in range(len(headers)))
        separator = "-+-".join("-" * width for width in widths)

        logger.info("FX RUN SUMMARY")
        logger.info(header_line)
        logger.info(separator)
        for row in rows:
            logger.info(" | ".join(row[index].ljust(widths[index]) for index in range(len(row))))

        failures = [
            results_by_bank.get(bank_class)
            for bank_class in self.bank_classes
            if results_by_bank.get(bank_class, {}).get("status") != "SUCCESS"
        ]
        if failures:
            logger.warning("FX RUN ERRORS")
            for failure in failures:
                if not failure:
                    continue
                logger.warning(
                    "%s: place=%s | error=%s",
                    failure.get("bank", "UNKNOWN"),
                    failure.get("place", ""),
                    failure.get("error", ""),
                )
