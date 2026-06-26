-- Align payments with the ERD: payments belong to subscriptions, and the
-- currency column is named currency_code.

ALTER TABLE payments
    RENAME COLUMN currency TO currency_code;

UPDATE payments
SET currency_code = UPPER(COALESCE(currency_code, 'USD'));

ALTER TABLE payments
    ALTER COLUMN currency_code SET DEFAULT 'USD',
    ALTER COLUMN currency_code SET NOT NULL;

ALTER TABLE payments
    DROP CONSTRAINT IF EXISTS chk_payments_currency_code;

ALTER TABLE payments
    ADD CONSTRAINT chk_payments_currency_code
    CHECK (currency_code = UPPER(currency_code) AND length(currency_code) = 3);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM payments
        WHERE subscription_id IS NULL
    ) THEN
        RAISE EXCEPTION 'Cannot align payments with ERD while payments.subscription_id contains NULL rows. Backfill subscription_id or archive those rows before running migration 000021.';
    END IF;
END $$;

ALTER TABLE payments
    ALTER COLUMN subscription_id SET NOT NULL;

ALTER TABLE payments
    DROP CONSTRAINT IF EXISTS payments_subscription_id_fkey;

ALTER TABLE payments
    ADD CONSTRAINT payments_subscription_id_fkey
    FOREIGN KEY (subscription_id)
    REFERENCES user_subscriptions(subscription_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE;

ALTER TABLE payments
    DROP COLUMN IF EXISTS user_id;

CREATE INDEX IF NOT EXISTS idx_payments_subscription_id
ON payments(subscription_id);

CREATE INDEX IF NOT EXISTS idx_payments_status_payment_date
ON payments(payment_status, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status
ON user_subscriptions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id
ON user_subscriptions(plan_id);
