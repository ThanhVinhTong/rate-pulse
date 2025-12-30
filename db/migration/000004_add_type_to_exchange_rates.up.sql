-- Add `type` column to `exchange_rates`
-- Make it NOT NULL with a safe default so applying to existing DBs succeeds
ALTER TABLE exchange_rates
    ADD COLUMN type INT NOT NULL DEFAULT 0; -- e.g 0: both, 1: cash, 2: card
