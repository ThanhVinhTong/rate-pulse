-- ==============================================================
-- 1. Create the countries table
-- ==============================================================
CREATE TABLE IF NOT EXISTS countries (
    country_id      SERIAL PRIMARY KEY,
    country_name    VARCHAR(100) NOT NULL,
    currency_id     INT NOT NULL REFERENCES currencies(currency_id),
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================
-- 2. Migrate existing currency_country data to countries table
-- ==============================================================
INSERT INTO countries (country_name, currency_id)
SELECT DISTINCT currency_country, currency_id
FROM currencies
WHERE currency_country IS NOT NULL;

-- ==============================================================
-- 3. Drop the currency_country column from currencies table
-- ==============================================================
ALTER TABLE currencies DROP COLUMN currency_country;

-- ==============================================================
-- 4. Add index for foreign key lookup
-- ==============================================================
CREATE INDEX idx_countries_currency_id ON countries(currency_id);
