-- The fee rules apply to any exchange-rate source, not only banks.
-- Keep existing rows by renaming the simplified table created in v19.
DO $$
BEGIN
    IF to_regclass('public.bank_fee_rules') IS NOT NULL
       AND to_regclass('public.rate_source_fee_rules') IS NOT NULL THEN
        RAISE EXCEPTION 'Both bank_fee_rules and rate_source_fee_rules exist. Merge or drop one manually before running migration 000020.';
    END IF;

    IF to_regclass('public.rate_source_fee_rules') IS NULL THEN
        IF to_regclass('public.bank_fee_rules') IS NOT NULL THEN
            ALTER TABLE bank_fee_rules DISABLE ROW LEVEL SECURITY;
            ALTER TABLE bank_fee_rules RENAME TO rate_source_fee_rules;
        ELSE
            CREATE TABLE rate_source_fee_rules (
                fee_rule_id           SERIAL PRIMARY KEY,
                source_id             INT NOT NULL REFERENCES rate_sources(source_id) ON DELETE CASCADE ON UPDATE CASCADE,
                type_id               INT NOT NULL REFERENCES exchange_rate_types(type_id) ON DELETE RESTRICT ON UPDATE CASCADE,

                fee_rate              NUMERIC(12,8),
                vat_rate              NUMERIC(12,8) NOT NULL DEFAULT 0.10,
                vat_applies           VARCHAR(10) NOT NULL DEFAULT 'unknown',
                fee_includes_vat      BOOLEAN NOT NULL DEFAULT FALSE,

                swift_fee             NUMERIC(20,6),
                swift_fee_currency_id INT REFERENCES currencies(currency_id) ON DELETE RESTRICT ON UPDATE CASCADE,

                source_url            TEXT,
                source_note           TEXT,
                effective_from        DATE NOT NULL,
                effective_to          DATE,
                updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT chk_rate_source_fee_rules_fee_rate
                    CHECK (fee_rate IS NULL OR fee_rate >= 0),
                CONSTRAINT chk_rate_source_fee_rules_vat_rate
                    CHECK (vat_rate >= 0),
                CONSTRAINT chk_rate_source_fee_rules_vat_applies
                    CHECK (vat_applies IN ('true', 'false', 'unknown')),
                CONSTRAINT chk_rate_source_fee_rules_swift_fee
                    CHECK (swift_fee IS NULL OR swift_fee >= 0),
                CONSTRAINT chk_rate_source_fee_rules_swift_currency
                    CHECK (
                        (swift_fee IS NULL AND swift_fee_currency_id IS NULL)
                        OR (swift_fee IS NOT NULL AND swift_fee_currency_id IS NOT NULL)
                    ),
                CONSTRAINT chk_rate_source_fee_rules_effective_dates
                    CHECK (effective_to IS NULL OR effective_from <= effective_to)
            );
        END IF;
    END IF;

    IF to_regclass('public.bank_fee_rules_fee_rule_id_seq') IS NOT NULL
       AND to_regclass('public.rate_source_fee_rules_fee_rule_id_seq') IS NULL THEN
        ALTER SEQUENCE bank_fee_rules_fee_rule_id_seq RENAME TO rate_source_fee_rules_fee_rule_id_seq;
    END IF;
END $$;

DROP INDEX IF EXISTS idx_bank_fee_rules_source_type;
DROP INDEX IF EXISTS idx_bank_fee_rules_effective_dates;

CREATE INDEX IF NOT EXISTS idx_rate_source_fee_rules_source_type
ON rate_source_fee_rules(source_id, type_id, effective_from DESC);

CREATE INDEX IF NOT EXISTS idx_rate_source_fee_rules_effective_dates
ON rate_source_fee_rules(effective_from, effective_to);

ALTER TABLE IF EXISTS rate_source_fee_rules ENABLE ROW LEVEL SECURITY;
