DROP INDEX IF EXISTS idx_rate_source_fee_rules_lookup;

ALTER TABLE IF EXISTS rate_source_fee_rules
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_swift_fee_inclusion,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_fee_amount_currency,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_fee_rate_range,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_fee_rate_max,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_fee_rate_min,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_min_max_fee,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_max_fee,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_min_fee,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_fixed_fee,
    DROP CONSTRAINT IF EXISTS chk_rate_source_fee_rules_transaction_type;

ALTER TABLE IF EXISTS rate_source_fee_rules
    DROP COLUMN IF EXISTS swift_fee_included,
    DROP COLUMN IF EXISTS fee_rate_max,
    DROP COLUMN IF EXISTS fee_rate_min,
    DROP COLUMN IF EXISTS max_fee,
    DROP COLUMN IF EXISTS min_fee,
    DROP COLUMN IF EXISTS fixed_fee,
    DROP COLUMN IF EXISTS fee_currency_id,
    DROP COLUMN IF EXISTS channel,
    DROP COLUMN IF EXISTS transaction_type;
