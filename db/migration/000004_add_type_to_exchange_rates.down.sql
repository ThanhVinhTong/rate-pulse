-- Revert `type` column addition on `exchange_rates`
ALTER TABLE exchange_rates
    DROP COLUMN IF EXISTS type;
