-- Migration v10: DOWN - Revert exchange_rate_types normalization
-- Run this to rollback the changes made in 0010_up.sql

-- 1. Restore the old `type` column (as VARCHAR to match original)
ALTER TABLE exchange_rates 
    ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- 2. Backfill the old `type` column from the new lookup table
UPDATE exchange_rates e
SET type = t.type_name
FROM exchange_rate_types t
WHERE e.type_id = t.type_id;

-- 3. Drop the new foreign key column
ALTER TABLE exchange_rates 
    DROP COLUMN IF EXISTS type_id;

-- 4. Drop the lookup table
DROP TABLE IF EXISTS exchange_rate_types;

-- Optional: If you added an index on type_id in the up migration, drop it here too:
-- DROP INDEX IF EXISTS idx_exchange_rates_type_id;