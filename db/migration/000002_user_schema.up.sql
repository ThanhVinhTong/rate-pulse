-- ==============================================================
-- 1. users
-- ==============================================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) DEFAULT 'NEW_USER' NOT NULL,
    email VARCHAR(100) DEFAULT 'NEW_USER@example.com' NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) DEFAULT 'free' CHECK (user_type IN ('free', 'premium', 'enterprise')),
    email_verified BOOLEAN DEFAULT FALSE,
    time_zone VARCHAR(50) DEFAULT 'UTC',
    language_preference VARCHAR(10) DEFAULT 'en',
    country_of_residence VARCHAR(3),
    country_of_birth VARCHAR(3),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================
-- 2. user_currency_preferences
-- ==============================================================
CREATE TABLE user_currency_preferences (
    currency_id INT NOT NULL REFERENCES currencies(currency_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    is_favorite BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (currency_id, user_id)
);

-- ==============================================================
-- 3. user_rate_source_preferences
-- ==============================================================
CREATE TABLE user_rate_source_preferences (
    source_id INT NOT NULL REFERENCES rate_sources(source_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (source_id, user_id)
);
