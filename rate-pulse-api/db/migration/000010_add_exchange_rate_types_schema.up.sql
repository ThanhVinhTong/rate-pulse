-- 1. Create the lookup table
CREATE TABLE IF NOT EXISTS exchange_rate_types (
    type_id   SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL
);

-- 2. Drop the old string column
ALTER TABLE exchange_rates
    DROP COLUMN IF EXISTS type;

-- 3. Add the new foreign key column
ALTER TABLE exchange_rates
    ADD COLUMN IF NOT EXISTS type_id INTEGER 
        REFERENCES exchange_rate_types(type_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE;