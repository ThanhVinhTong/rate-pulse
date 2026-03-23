from abc import ABC, abstractmethod
from sqlalchemy import text

class FX(ABC):
    def __init__(self, driver, connection):
        self.driver = driver
        self.connection = connection
        
    @abstractmethod
    def get_fx(self) -> None:
        pass

    def save_to_db(self, fx_list: list[dict]):
        if not fx_list:
            return
            
        inserted_count = 0
        for fx in fx_list:
            try:
                # Create a savepoint for this specific row.
                # If an error happens inside this block, it ONLY rolls back this single row!
                with self.connection.begin_nested():
                    # Check for duplicate before insertion
                    check_query = text("""
                        SELECT 1 FROM exchange_rates 
                        WHERE source_id = (SELECT source_id FROM rate_sources WHERE source_code = :source_code)
                          AND source_currency_id = (SELECT currency_id FROM currencies WHERE currency_code = :source_currency)
                          AND destination_currency_id = (SELECT currency_id FROM currencies WHERE currency_code = :destination_currency)
                          AND type_id = :type_id
                          AND rate_value = :rate_value
                          AND valid_from_date = :valid_from_date
                        ORDER BY valid_from_date DESC
                        LIMIT 1
                    """)
                    
                    result = self.connection.execute(check_query, fx).fetchone()
                    if result:
                        print(
                            f"Skipping duplicate: {fx['source_code']} | {fx['source_currency']} <-> {fx['destination_currency']} | {fx['rate_value']} | {fx['valid_from_date']} | {fx['type_id']}"
                        )
                        continue

                    self.connection.execute(text(\
                        "INSERT INTO exchange_rates (\
                            source_id, \
                            source_currency_id, \
                            destination_currency_id, \
                        type_id, \
                        rate_value, \
                        valid_from_date) \
                    VALUES (\
                        (SELECT source_id FROM rate_sources WHERE source_code = :source_code), \
                        (SELECT currency_id FROM currencies WHERE currency_code = :source_currency), \
                        (SELECT currency_id FROM currencies WHERE currency_code = :destination_currency), \
                        :type_id, \
                        :rate_value, \
                        :valid_from_date \
                    )"), fx)
                    inserted_count += 1
            except Exception as e:
                print(f"Error inserting {fx}: {e}")
        self.connection.commit()
        print(f"Inserted {inserted_count}/{len(fx_list)} records cleanly via FX base.")
