ALTER TABLE payments
    DROP CONSTRAINT IF EXISTS payments_subscription_id_fkey;

ALTER TABLE payments
    ALTER COLUMN subscription_id DROP NOT NULL;

ALTER TABLE payments
    ADD CONSTRAINT payments_subscription_id_fkey
    FOREIGN KEY (subscription_id)
    REFERENCES user_subscriptions(subscription_id)
    ON DELETE SET NULL;

ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS user_id INT;

UPDATE payments p
SET user_id = us.user_id
FROM user_subscriptions us
WHERE p.subscription_id = us.subscription_id
  AND p.user_id IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM payments
        WHERE user_id IS NULL
    ) THEN
        RAISE EXCEPTION 'Cannot roll back migration 000021 while payments.user_id cannot be restored from user_subscriptions.';
    END IF;
END $$;

ALTER TABLE payments
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE payments
    DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

ALTER TABLE payments
    ADD CONSTRAINT payments_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE;

ALTER TABLE payments
    DROP CONSTRAINT IF EXISTS chk_payments_currency_code;

ALTER TABLE payments
    RENAME COLUMN currency_code TO currency;

ALTER TABLE payments
    ALTER COLUMN currency SET DEFAULT 'USD',
    ALTER COLUMN currency SET NOT NULL;

DROP INDEX IF EXISTS idx_user_subscriptions_plan_id;
DROP INDEX IF EXISTS idx_user_subscriptions_user_status;
DROP INDEX IF EXISTS idx_payments_status_payment_date;
DROP INDEX IF EXISTS idx_payments_subscription_id;
