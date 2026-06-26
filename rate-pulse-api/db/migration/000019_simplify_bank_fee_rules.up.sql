ALTER TABLE IF EXISTS bank_fee_rules DISABLE ROW LEVEL SECURITY;

DROP INDEX IF EXISTS idx_bank_fee_rules_conditions;
DROP INDEX IF EXISTS idx_bank_fee_rules_effective_dates;
DROP INDEX IF EXISTS idx_bank_fee_rules_source_category;
DROP INDEX IF EXISTS idx_bank_fee_rules_source_transaction;

DROP TABLE IF EXISTS bank_fee_rules;

CREATE TABLE IF NOT EXISTS bank_fee_rules (
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

    CONSTRAINT chk_bank_fee_rules_fee_rate
        CHECK (fee_rate IS NULL OR fee_rate >= 0),
    CONSTRAINT chk_bank_fee_rules_vat_rate
        CHECK (vat_rate >= 0),
    CONSTRAINT chk_bank_fee_rules_vat_applies
        CHECK (vat_applies IN ('true', 'false', 'unknown')),
    CONSTRAINT chk_bank_fee_rules_swift_fee
        CHECK (swift_fee IS NULL OR swift_fee >= 0),
    CONSTRAINT chk_bank_fee_rules_swift_currency
        CHECK (
            (swift_fee IS NULL AND swift_fee_currency_id IS NULL)
            OR (swift_fee IS NOT NULL AND swift_fee_currency_id IS NOT NULL)
        ),
    CONSTRAINT chk_bank_fee_rules_effective_dates
        CHECK (effective_to IS NULL OR effective_from <= effective_to)
);

CREATE INDEX IF NOT EXISTS idx_bank_fee_rules_source_type
ON bank_fee_rules(source_id, type_id, effective_from DESC);

CREATE INDEX IF NOT EXISTS idx_bank_fee_rules_effective_dates
ON bank_fee_rules(effective_from, effective_to);

ALTER TABLE IF EXISTS bank_fee_rules ENABLE ROW LEVEL SECURITY;
