ALTER TABLE IF EXISTS bank_fee_rules DISABLE ROW LEVEL SECURITY;

DROP INDEX IF EXISTS idx_bank_fee_rules_effective_dates;
DROP INDEX IF EXISTS idx_bank_fee_rules_source_type;

DROP TABLE IF EXISTS bank_fee_rules;

CREATE TABLE IF NOT EXISTS bank_fee_rules (
    fee_rule_id                 SERIAL PRIMARY KEY,
    source_id                   INT NOT NULL REFERENCES rate_sources(source_id) ON DELETE CASCADE ON UPDATE CASCADE,
    transaction_type            VARCHAR(50) NOT NULL,
    fee_name                    VARCHAR(150) NOT NULL,
    fee_category                VARCHAR(50) NOT NULL DEFAULT 'bank_fee',
    fee_basis                   VARCHAR(50) NOT NULL DEFAULT 'transaction_amount',

    source_currency_id          INT REFERENCES currencies(currency_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    destination_currency_id     INT REFERENCES currencies(currency_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    fee_currency_id             INT REFERENCES currencies(currency_id) ON DELETE RESTRICT ON UPDATE CASCADE,

    fee_rate                    NUMERIC(12,8),
    fixed_fee                   NUMERIC(20,6),
    min_fee                     NUMERIC(20,6),
    max_fee                     NUMERIC(20,6),

    vat_rate                    NUMERIC(12,8),
    vat_applies                 VARCHAR(10) NOT NULL DEFAULT 'unknown',
    fee_includes_vat            BOOLEAN NOT NULL DEFAULT FALSE,

    swift_fee                   NUMERIC(20,6),
    swift_fee_currency_id       INT REFERENCES currencies(currency_id) ON DELETE RESTRICT ON UPDATE CASCADE,

    intermediary_fee            NUMERIC(20,6),
    intermediary_fee_currency_id INT REFERENCES currencies(currency_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    intermediary_fee_status     VARCHAR(20) NOT NULL DEFAULT 'unknown',

    recipient_fee               NUMERIC(20,6),
    recipient_fee_currency_id   INT REFERENCES currencies(currency_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    recipient_fee_status        VARCHAR(20) NOT NULL DEFAULT 'unknown',

    exchange_rate_markup        NUMERIC(12,8),
    exchange_rate_markup_status VARCHAR(20) NOT NULL DEFAULT 'unknown',

    card_scheme                 VARCHAR(50),
    card_type                   VARCHAR(100),
    customer_tier               VARCHAR(100),
    channel                     VARCHAR(50),
    country_code                VARCHAR(3),
    conditions                  JSONB NOT NULL DEFAULT '{}'::jsonb,

    source_url                  TEXT,
    source_note                 TEXT,
    effective_from              DATE NOT NULL,
    effective_to                DATE,
    updated_at                  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at                  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_bank_fee_rules_fee_rate
        CHECK (fee_rate IS NULL OR fee_rate >= 0),
    CONSTRAINT chk_bank_fee_rules_fixed_fee
        CHECK (fixed_fee IS NULL OR fixed_fee >= 0),
    CONSTRAINT chk_bank_fee_rules_min_fee
        CHECK (min_fee IS NULL OR min_fee >= 0),
    CONSTRAINT chk_bank_fee_rules_max_fee
        CHECK (max_fee IS NULL OR max_fee >= 0),
    CONSTRAINT chk_bank_fee_rules_min_max_fee
        CHECK (min_fee IS NULL OR max_fee IS NULL OR max_fee >= min_fee),
    CONSTRAINT chk_bank_fee_rules_vat_rate
        CHECK (vat_rate IS NULL OR vat_rate >= 0),
    CONSTRAINT chk_bank_fee_rules_vat_applies
        CHECK (vat_applies IN ('true', 'false', 'unknown')),
    CONSTRAINT chk_bank_fee_rules_swift_fee
        CHECK (swift_fee IS NULL OR swift_fee >= 0),
    CONSTRAINT chk_bank_fee_rules_swift_currency
        CHECK (
            (swift_fee IS NULL AND swift_fee_currency_id IS NULL)
            OR (swift_fee IS NOT NULL AND swift_fee_currency_id IS NOT NULL)
        ),
    CONSTRAINT chk_bank_fee_rules_swift_transfer_only
        CHECK (
            swift_fee IS NULL
            OR transaction_type IN ('bank_transfer', 'international_transfer')
        ),
    CONSTRAINT chk_bank_fee_rules_intermediary_fee
        CHECK (intermediary_fee IS NULL OR intermediary_fee >= 0),
    CONSTRAINT chk_bank_fee_rules_intermediary_status
        CHECK (intermediary_fee_status IN ('exact', 'estimated', 'variable', 'unknown', 'not_applicable')),
    CONSTRAINT chk_bank_fee_rules_recipient_fee
        CHECK (recipient_fee IS NULL OR recipient_fee >= 0),
    CONSTRAINT chk_bank_fee_rules_recipient_status
        CHECK (recipient_fee_status IN ('exact', 'estimated', 'variable', 'unknown', 'not_applicable')),
    CONSTRAINT chk_bank_fee_rules_exchange_rate_markup
        CHECK (exchange_rate_markup IS NULL OR exchange_rate_markup >= 0),
    CONSTRAINT chk_bank_fee_rules_exchange_rate_markup_status
        CHECK (exchange_rate_markup_status IN ('exact', 'estimated', 'variable', 'unknown', 'not_applicable')),
    CONSTRAINT chk_bank_fee_rules_effective_dates
        CHECK (effective_to IS NULL OR effective_from <= effective_to),
    CONSTRAINT chk_bank_fee_rules_country_code
        CHECK (country_code IS NULL OR country_code = UPPER(country_code))
);

CREATE INDEX IF NOT EXISTS idx_bank_fee_rules_source_transaction
ON bank_fee_rules(source_id, transaction_type, effective_from DESC);

CREATE INDEX IF NOT EXISTS idx_bank_fee_rules_source_category
ON bank_fee_rules(source_id, fee_category);

CREATE INDEX IF NOT EXISTS idx_bank_fee_rules_effective_dates
ON bank_fee_rules(effective_from, effective_to);

CREATE INDEX IF NOT EXISTS idx_bank_fee_rules_conditions
ON bank_fee_rules USING GIN (conditions);

ALTER TABLE IF EXISTS bank_fee_rules ENABLE ROW LEVEL SECURITY;
