CREATE TABLE IF NOT EXISTS verify_emails (
    id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    email VARCHAR(100) NOT NULL,
    secret_code_hash VARCHAR(255) NOT NULL UNIQUE,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '15 minutes'),

    CONSTRAINT verify_emails_expiry_after_created
        CHECK (expired_at > created_at)
);

CREATE INDEX IF NOT EXISTS verify_emails_user_id_idx
ON verify_emails(user_id);

CREATE INDEX IF NOT EXISTS verify_emails_active_user_idx
ON verify_emails(user_id)
WHERE is_used = FALSE;