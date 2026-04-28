For GetCountryByCode
CREATE UNIQUE INDEX IF NOT EXISTS idx_countries_country_code
ON countries(country_code)
WHERE country_code IS NOT NULL;

-- For GetAllExchangeRatesToday
CREATE INDEX IF NOT EXISTS idx_exchange_rates_source_created_rate
ON exchange_rates(source_currency_id, created_at DESC, rate_id DESC);

-- For GetAllExchangeRatesToday
CREATE INDEX IF NOT EXISTS idx_exchange_rates_source_created_rate
ON exchange_rates(source_currency_id, created_at DESC, rate_id DESC);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_latest_normalised
ON exchange_rates (
  source_currency_id,
  destination_currency_id,
  source_id,
  type_id,
  updated_at DESC NULLS LAST
);