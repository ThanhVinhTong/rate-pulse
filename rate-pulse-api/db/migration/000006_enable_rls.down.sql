-- ==============================================================
-- Roll back RLS enablement on all application tables.
-- ==============================================================
ALTER TABLE IF EXISTS currencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rate_sources DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exchange_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_currency_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_rate_source_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscription_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS countries DISABLE ROW LEVEL SECURITY;
