-- Add enough structure to model real bank fee policies without duplicating
-- exchange-rate rows. The FX rate type still records what the bank publishes;
-- transaction_type records the customer action the fee applies to.

DO $$
BEGIN
    IF to_regclass('public.rate_source_fee_rules') IS NULL THEN
        RAISE EXCEPTION 'rate_source_fee_rules does not exist. Run migrations through 000020 before 000022.';
    END IF;
END $$;

ALTER TABLE rate_source_fee_rules
    ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS channel VARCHAR(50),
    ADD COLUMN IF NOT EXISTS fee_currency_id INT REFERENCES currencies(currency_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD COLUMN IF NOT EXISTS fixed_fee NUMERIC(20,6),
    ADD COLUMN IF NOT EXISTS min_fee NUMERIC(20,6),
    ADD COLUMN IF NOT EXISTS max_fee NUMERIC(20,6),
    ADD COLUMN IF NOT EXISTS fee_rate_min NUMERIC(12,8),
    ADD COLUMN IF NOT EXISTS fee_rate_max NUMERIC(12,8),
    ADD COLUMN IF NOT EXISTS swift_fee_included BOOLEAN;

UPDATE rate_source_fee_rules
SET
    transaction_type = COALESCE(transaction_type, 'transfer'),
    channel = COALESCE(channel, 'default'),
    swift_fee_included = COALESCE(swift_fee_included, FALSE);

ALTER TABLE rate_source_fee_rules
    ALTER COLUMN transaction_type SET DEFAULT 'transfer',
    ALTER COLUMN transaction_type SET NOT NULL,
    ALTER COLUMN channel SET DEFAULT 'default',
    ALTER COLUMN channel SET NOT NULL,
    ALTER COLUMN swift_fee_included SET DEFAULT FALSE,
    ALTER COLUMN swift_fee_included SET NOT NULL;

ALTER TABLE rate_source_fee_rules
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_transaction_type,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_fixed_fee,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_min_fee,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_max_fee,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_min_max_fee,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_fee_rate_min,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_fee_rate_max,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_fee_rate_range,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_fee_amount_currency,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_swift_fee_inclusion;

ALTER TABLE rate_source_fee_rules
    ADD CONSTRAINT chk_rate_source_fee_rules_transaction_type
        CHECK (transaction_type IN ('transfer', 'cash', 'cheque', 'card', 'unknown')),
    ADD CONSTRAINT chk_rate_source_fee_rules_fixed_fee
        CHECK (fixed_fee IS NULL OR fixed_fee >= 0),
    ADD CONSTRAINT chk_rate_source_fee_rules_min_fee
        CHECK (min_fee IS NULL OR min_fee >= 0),
    ADD CONSTRAINT chk_rate_source_fee_rules_max_fee
        CHECK (max_fee IS NULL OR max_fee >= 0),
    ADD CONSTRAINT chk_rate_source_fee_rules_min_max_fee
        CHECK (min_fee IS NULL OR max_fee IS NULL OR max_fee >= min_fee),
    ADD CONSTRAINT chk_rate_source_fee_rules_fee_rate_min
        CHECK (fee_rate_min IS NULL OR fee_rate_min >= 0),
    ADD CONSTRAINT chk_rate_source_fee_rules_fee_rate_max
        CHECK (fee_rate_max IS NULL OR fee_rate_max >= 0),
    ADD CONSTRAINT chk_rate_source_fee_rules_fee_rate_range
        CHECK (fee_rate_min IS NULL OR fee_rate_max IS NULL OR fee_rate_max >= fee_rate_min),
    ADD CONSTRAINT chk_rate_source_fee_rules_fee_amount_currency
        CHECK (
            (fixed_fee IS NULL AND min_fee IS NULL AND max_fee IS NULL)
            OR fee_currency_id IS NOT NULL
        ),
    ADD CONSTRAINT chk_rate_source_fee_rules_swift_fee_inclusion
        CHECK (swift_fee_included = FALSE OR swift_fee IS NULL);

CREATE INDEX IF NOT EXISTS idx_rate_source_fee_rules_lookup
ON rate_source_fee_rules(source_id, type_id, transaction_type, channel, effective_from DESC);
