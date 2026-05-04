-- For GetCountryByCode
DROP INDEX IF EXISTS idx_countries_country_code;

-- For GetAllExchangeRatesToday (first duplicate in your up.sql)
DROP INDEX IF EXISTS idx_exchange_rates_source_created_rate;

-- For GetAllExchangeRatesToday (second duplicate)
DROP INDEX IF EXISTS idx_exchange_rates_source_created_rate;

-- For the concurrent index
DROP INDEX IF EXISTS idx_exchange_rates_latest_normalised;