-- name: CreateExchangeRate :one
INSERT INTO exchange_rates (rate_value, source_currency_id, destination_currency_id, valid_from_date, valid_to_date, source_id, type_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetExchangeRateByID :one
SELECT * FROM exchange_rates
WHERE rate_id = $1 LIMIT 1;

-- name: GetAllExchangeRates :many
SELECT * FROM exchange_rates
ORDER BY rate_id
LIMIT $1
OFFSET $2;

-- name: GetExchangeRatesByType :many
SELECT * FROM exchange_rates
WHERE type_id = $1
ORDER BY rate_id
LIMIT $2
OFFSET $3;

-- name: GetExchangeRatesByCurrencyPair :many
SELECT * FROM exchange_rates
WHERE source_currency_id = $1 AND destination_currency_id = $2
ORDER BY valid_from_date DESC
LIMIT $3
OFFSET $4;

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