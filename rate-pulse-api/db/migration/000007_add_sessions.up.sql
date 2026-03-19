-- ==============================================================
-- 1. sessions
-- ==============================================================
CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    refresh_token VARCHAR NOT NULL,
    user_agent VARCHAR NOT NULL, -- to keep track of the user type and whether the user is connecting to the server or not
    client_ip VARCHAR(45) NOT NULL,
    is_blocked BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================
-- 2. Enable RLS on sessions
-- ==============================================================
ALTER TABLE IF EXISTS sessions ENABLE ROW LEVEL SECURITY;
