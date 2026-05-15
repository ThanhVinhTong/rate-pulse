import logging
from abc import ABC, abstractmethod
from datetime import timedelta, timezone

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from selenium.common.exceptions import WebDriverException

logger = logging.getLogger(__name__)


class FX(ABC):
    def __init__(self, driver, connection):
        self.driver = driver
        self.connection = connection
        self.last_scrape_summary = self._empty_scrape_summary()
        
    @abstractmethod
    def get_fx(self) -> None:
        pass

    @staticmethod
    def vn_timezone():
        return timezone(timedelta(hours=7), "UTC+7")

    def open_page(self, *, name: str, url: str, wait_seconds: float = 5) -> bool:
        import time

        try:
            self.driver.get(url)
            logger.info("%s: scraping FX from %s", name, url)
            time.sleep(wait_seconds)
            return True
        except WebDriverException as e:
            self.log_scrape_failure(name=name, place="navigation", error=f"{url}: {e}")
            return False

    def append_rates(
        self,
        *,
        fx_list: list[dict],
        source_code: str,
        source_currency: str,
        destination_currency: str,
        rates_by_type: dict[str, float | None],
        translate_column: dict[str, int],
        valid_from_date,
    ) -> None:
        for type_name, rate_val in rates_by_type.items():
            if rate_val is None:
                continue
            fx_list.append(
                {
                    "source_code": source_code,
                    "source_currency": source_currency,
                    "destination_currency": destination_currency,
                    "type_id": translate_column[type_name],
                    "rate_value": rate_val,
                    "valid_from_date": valid_from_date,
                }
            )

    def save_to_db(self, fx_list: list[dict]) -> dict[str, int | bool]:
        result = {
            "success": True,
            "inserted": 0,
            "duplicates": 0,
            "failed": 0,
        }

        if not fx_list:
            logger.debug("%s: no rows to persist (empty scrape or all rates missing)", self.__class__.__name__)
            return result

        for fx in fx_list:
            try:
                with self.connection.begin_nested():
                    check_query = text("""
                        SELECT 1 FROM exchange_rates 
                        WHERE source_id = (
                            SELECT source_id
                            FROM rate_sources
                            WHERE LOWER(source_code) = LOWER(:source_code)
                            LIMIT 1
                          )
                          AND source_currency_id = (
                            SELECT currency_id
                            FROM currencies
                            WHERE LOWER(currency_code) = LOWER(:source_currency)
                            LIMIT 1
                          )
                          AND destination_currency_id = (
                            SELECT currency_id
                            FROM currencies
                            WHERE LOWER(currency_code) = LOWER(:destination_currency)
                            LIMIT 1
                          )
                          AND type_id = :type_id
                          AND rate_value = :rate_value
                          AND date_trunc('day', valid_from_date) = date_trunc('day', CAST(:valid_from_date AS TIMESTAMP))
                          AND FLOOR(EXTRACT(HOUR FROM valid_from_date) / 2) = FLOOR(EXTRACT(HOUR FROM CAST(:valid_from_date AS TIMESTAMP)) / 2)
                        ORDER BY valid_from_date DESC
                        LIMIT 1
                    """)

                    existing_rate = self.connection.execute(check_query, fx).fetchone()
                    if existing_rate:
                        logger.debug(
                            "Skipping duplicate: %s | %s <-> %s | %s | %s | type %s",
                            fx.get("source_code"),
                            fx.get("source_currency"),
                            fx.get("destination_currency"),
                            fx.get("rate_value"),
                            fx.get("valid_from_date"),
                            fx.get("type_id"),
                        )
                        result["duplicates"] += 1
                        continue

                    self.connection.execute(
                        text(
                            "INSERT INTO exchange_rates ("
                            "source_id, "
                            "source_currency_id, "
                            "destination_currency_id, "
                            "type_id, "
                            "rate_value, "
                            "valid_from_date) "
                            "VALUES ("
                            "(SELECT source_id FROM rate_sources WHERE LOWER(source_code) = LOWER(:source_code) LIMIT 1), "
                            "(SELECT currency_id FROM currencies WHERE LOWER(currency_code) = LOWER(:source_currency) LIMIT 1), "
                            "(SELECT currency_id FROM currencies WHERE LOWER(currency_code) = LOWER(:destination_currency) LIMIT 1), "
                            ":type_id, "
                            ":rate_value, "
                            ":valid_from_date "
                            ")"
                        ),
                        fx,
                    )
                    result["inserted"] += 1
            except SQLAlchemyError as e:
                result["success"] = False
                result["failed"] += 1
                logger.warning(
                    "DB error for row source=%s destination=%s type_id=%s value=%s valid_from=%s: %s",
                    fx.get("source_code"),
                    fx.get("destination_currency"),
                    fx.get("type_id"),
                    fx.get("rate_value"),
                    fx.get("valid_from_date"),
                    e,
                )
            except Exception as e:
                result["success"] = False
                result["failed"] += 1
                logger.warning("Unexpected error inserting row %s: %s", fx, e)

        try:
            self.connection.commit()
        except SQLAlchemyError as e:
            result["success"] = False
            logger.exception("Commit failed after FX inserts: %s", e)
            try:
                self.connection.rollback()
            except SQLAlchemyError as rb_err:
                logger.error("Rollback failed: %s", rb_err)
            return result

        logger.debug(
            "%s: DB persisted inserted=%s duplicate=%s failed=%s attempted=%s",
            self.__class__.__name__,
            result["inserted"],
            result["duplicates"],
            result["failed"],
            len(fx_list),
        )
        return result

    def log_row_error(self, *, name: str, row_index: int, row_text: str, error: Exception) -> None:
        logger.warning(
            "%s: skipped source row %s while parsing table row | row=%r | error=%s",
            name,
            row_index,
            row_text,
            error,
        )

    def log_scrape_summary(
        self,
        *,
        name: str,
        source_record_count: int,
        extracted_record_count: int,
        db_result: dict[str, int | bool],
        row_error_count: int = 0,
    ) -> None:
        success = bool(db_result.get("success")) and row_error_count == 0
        self.last_scrape_summary = {
            "bank": name,
            "status": "SUCCESS" if success else "FAILED",
            "link_records": source_record_count,
            "extracted_records": extracted_record_count,
            "inserted_records": int(db_result.get("inserted", 0)),
            "duplicate_records": int(db_result.get("duplicates", 0)),
            "db_failed_records": int(db_result.get("failed", 0)),
            "parse_failed_records": row_error_count,
            "place": "",
            "error": "",
        }
        logger.debug(
            "%s: status=%s | link_records=%s | extracted_records=%s | inserted_records=%s | duplicate_records=%s | db_failed_records=%s | parse_failed_records=%s",
            name,
            self.last_scrape_summary["status"],
            source_record_count,
            extracted_record_count,
            db_result.get("inserted", 0),
            db_result.get("duplicates", 0),
            db_result.get("failed", 0),
            row_error_count,
        )

    def log_scrape_failure(self, *, name: str, place: str, error: Exception | str) -> None:
        self.last_scrape_summary = {
            "bank": name,
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
        logger.warning(
            "%s: status=FAILED | link_records=0 | extracted_records=0 | inserted_records=0 | place=%s | error=%s",
            name,
            place,
            error,
        )

    @staticmethod
    def _empty_scrape_summary() -> dict[str, int | str]:
        return {
            "bank": "",
            "status": "FAILED",
            "link_records": 0,
            "extracted_records": 0,
            "inserted_records": 0,
            "duplicate_records": 0,
            "db_failed_records": 0,
            "parse_failed_records": 0,
            "place": "not completed",
            "error": "scraper returned before producing a summary",
        }
