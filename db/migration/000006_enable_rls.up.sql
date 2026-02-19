-- ==============================================================
-- Enable RLS on all application tables for Supabase safety.
-- ==============================================================
ALTER TABLE IF EXISTS currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rate_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_currency_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_rate_source_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS countries ENABLE ROW LEVEL SECURITY;
