DO $$
BEGIN
    IF to_regclass('public.bank_fee_rules') IS NOT NULL
       AND to_regclass('public.rate_source_fee_rules') IS NOT NULL THEN
        RAISE EXCEPTION 'Both bank_fee_rules and rate_source_fee_rules exist. Merge or drop one manually before rolling back migration 000020.';
    END IF;

    IF to_regclass('public.bank_fee_rules') IS NULL
       AND to_regclass('public.rate_source_fee_rules') IS NOT NULL THEN
        ALTER TABLE rate_source_fee_rules DISABLE ROW LEVEL SECURITY;
        ALTER TABLE rate_source_fee_rules RENAME TO bank_fee_rules;
    END IF;

    IF to_regclass('public.rate_source_fee_rules_fee_rule_id_seq') IS NOT NULL
       AND to_regclass('public.bank_fee_rules_fee_rule_id_seq') IS NULL THEN
        ALTER SEQUENCE rate_source_fee_rules_fee_rule_id_seq RENAME TO bank_fee_rules_fee_rule_id_seq;
    END IF;
END $$;

DROP INDEX IF EXISTS idx_rate_source_fee_rules_source_type;
DROP INDEX IF EXISTS idx_rate_source_fee_rules_effective_dates;

CREATE INDEX IF NOT EXISTS idx_bank_fee_rules_source_type
ON bank_fee_rules(source_id, type_id, effective_from DESC);

CREATE INDEX IF NOT EXISTS idx_bank_fee_rules_effective_dates
ON bank_fee_rules(effective_from, effective_to);

ALTER TABLE IF EXISTS bank_fee_rules ENABLE ROW LEVEL SECURITY;
