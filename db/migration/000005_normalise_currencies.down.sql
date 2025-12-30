-- ==============================================================
-- 1. Add back the currency_country column to currencies table
-- ==============================================================
ALTER TABLE currencies ADD COLUMN currency_country VARCHAR(100);

-- ==============================================================
-- 2. Migrate data back from countries to currencies
-- ==============================================================
UPDATE currencies c
SET currency_country = co.country_name
FROM countries co
WHERE c.currency_id = co.currency_id;

-- ==============================================================
-- 3. Drop the countries table
-- ==============================================================
DROP INDEX IF EXISTS idx_countries_currency_id;
DROP TABLE countries;

