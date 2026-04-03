-- name: CreateExchangeRate :one
INSERT INTO exchange_rates (rate_value, source_currency_id, destination_currency_id, valid_from_date, valid_to_date, source_id, type_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetExchangeRateByID :one
SELECT rate_id, rate_value, source_currency_id, destination_currency_id, valid_from_date, valid_to_date, source_id, type_id, created_at, updated_at
FROM exchange_rates
WHERE rate_id = $1 
LIMIT 1;

-- name: GetAllExchangeRatesToday :many
SELECT rate_id, rate_value, source_currency_id, destination_currency_id, valid_from_date, valid_to_date, source_id, type_id, created_at, updated_at
FROM exchange_rates
WHERE created_at >= (SELECT NOW()::date)
AND source_currency_id = $1
ORDER BY rate_id DESC
LIMIT $2; -- $2: page size

-- -- name: GetExchangeRatesByTypeAfterID :many
-- SELECT rate_id, rate_value, source_currency_id, destination_currency_id, valid_from_date, valid_to_date, source_id, type_id, created_at, updated_at
-- FROM exchange_rates
-- WHERE created_at >= (SELECT NOW()::date)
--   AND rate_id > $2
-- ORDER BY rate_id
-- LIMIT $3;

-- -- name: GetExchangeRatesByCurrencyPairAfter :many
-- SELECT rate_id, rate_value, source_currency_id, destination_currency_id, valid_from_date, valid_to_date, source_id, type_id, created_at, updated_at
-- FROM exchange_rates
-- WHERE source_currency_id = $1
--   AND destination_currency_id = $2
--   AND (
--     valid_from_date < $3
--     OR (valid_from_date = $3 AND rate_id < $4)
--   )
-- ORDER BY valid_from_date DESC, rate_id DESC
-- LIMIT $5;

-- -- name: GetLatestRatesByPairSourceType :many
-- WITH ranked AS (
--   SELECT
--     er.rate_id,
--     er.rate_value,
--     er.source_currency_id,
--     er.destination_currency_id,
--     er.source_id,
--     er.type_id,
--     er.valid_from_date,
--     er.updated_at,
--     ROW_NUMBER() OVER (
--       PARTITION BY er.source_id, er.source_currency_id, er.destination_currency_id, er.type_id
--       ORDER BY er.valid_from_date DESC, er.rate_id DESC
--     ) AS rn
--   FROM exchange_rates er
--   WHERE er.source_currency_id = $1
--     AND er.destination_currency_id = $2
-- )
-- SELECT
--   rate_id, rate_value, source_currency_id, destination_currency_id, source_id, type_id, valid_from_date, updated_at
-- FROM ranked
-- WHERE rn = 1
-- ORDER BY source_id, type_id;

-- -- name: GetExchangeRatesByCurrencyPairLatest :many
-- SELECT rate_id, rate_value, source_currency_id, destination_currency_id, valid_from_date, valid_to_date, source_id, type_id, created_at, updated_at
-- FROM exchange_rates
-- WHERE source_currency_id = $1
--   AND destination_currency_id = $2
-- ORDER BY valid_from_date DESC, rate_id DESC
-- LIMIT $3;

-- name: UpdateExchangeRate :one
UPDATE exchange_rates
SET 
    rate_value = COALESCE($2, rate_value),
    source_currency_id = COALESCE($3, source_currency_id),
    destination_currency_id = COALESCE($4, destination_currency_id),
    valid_from_date = COALESCE($5, valid_from_date),
    valid_to_date = COALESCE($6, valid_to_date),
    source_id = COALESCE($7, source_id),
    type_id = COALESCE($8, type_id),
    updated_at = CURRENT_TIMESTAMP
WHERE rate_id = $1
RETURNING *;

-- name: DeleteExchangeRate :exec
DELETE FROM exchange_rates
WHERE rate_id = $1;

-- name: DeleteAllExchangeRates :exec
DELETE FROM exchange_rates;