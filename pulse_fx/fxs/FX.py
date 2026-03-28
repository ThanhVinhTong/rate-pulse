import logging
from abc import ABC, abstractmethod

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger(__name__)


class FX(ABC):
    def __init__(self, driver, connection):
        self.driver = driver
        self.connection = connection
        
    @abstractmethod
    def get_fx(self) -> None:
        pass

    def save_to_db(self, fx_list: list[dict]) -> None:
        if not fx_list:
            logger.info("%s: no rows to persist (empty scrape or all rates missing)", self.__class__.__name__)
            return

        inserted_count = 0
        for fx in fx_list:
            try:
                with self.connection.begin_nested():
                    check_query = text("""
                        SELECT 1 FROM exchange_rates 
                        WHERE source_id = (SELECT source_id FROM rate_sources WHERE source_code = :source_code)
                          AND source_currency_id = (SELECT currency_id FROM currencies WHERE currency_code = :source_currency)
                          AND destination_currency_id = (SELECT currency_id FROM currencies WHERE currency_code = :destination_currency)
                          AND type_id = :type_id
                          AND rate_value = :rate_value
                        ORDER BY valid_from_date DESC
                        LIMIT 1
                    """)

                    result = self.connection.execute(check_query, fx).fetchone()
                    if result:
                        logger.debug(
                            "Skipping duplicate: %s | %s <-> %s | %s | %s | type %s",
                            fx.get("source_code"),
                            fx.get("source_currency"),
                            fx.get("destination_currency"),
                            fx.get("rate_value"),
                            fx.get("valid_from_date"),
                            fx.get("type_id"),
                        )
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
                            "(SELECT source_id FROM rate_sources WHERE source_code = :source_code), "
                            "(SELECT currency_id FROM currencies WHERE currency_code = :source_currency), "
                            "(SELECT currency_id FROM currencies WHERE currency_code = :destination_currency), "
                            ":type_id, "
                            ":rate_value, "
                            ":valid_from_date "
                            ")"
                        ),
                        fx,
                    )
                    inserted_count += 1
            except SQLAlchemyError as e:
                logger.warning(
                    "DB error for row %s (%s): %s",
                    fx.get("source_code"),
                    fx.get("destination_currency"),
                    e,
                )
            except Exception as e:
                logger.warning("Unexpected error inserting row %s: %s", fx, e)

        try:
            self.connection.commit()
        except SQLAlchemyError as e:
            logger.exception("Commit failed after FX inserts: %s", e)
            try:
                self.connection.rollback()
            except SQLAlchemyError as rb_err:
                logger.error("Rollback failed: %s", rb_err)
            return

        logger.info(
            "%s: inserted %s/%s row(s)",
            self.__class__.__name__,
            inserted_count,
            len(fx_list),
        )
