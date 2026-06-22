ALTER TABLE IF EXISTS bank_fee_rules DISABLE ROW LEVEL SECURITY;

DROP INDEX IF EXISTS idx_bank_fee_rules_conditions;
DROP INDEX IF EXISTS idx_bank_fee_rules_effective_dates;
DROP INDEX IF EXISTS idx_bank_fee_rules_source_category;
DROP INDEX IF EXISTS idx_bank_fee_rules_source_transaction;

DROP TABLE IF EXISTS bank_fee_rules;
