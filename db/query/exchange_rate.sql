-- name: CreateExchangeRate :one
INSERT INTO exchange_rates (rate_value, source_currency_id, destination_currency_id, valid_from_date, valid_to_date, source_id)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetExchangeRateByID :one
SELECT * FROM exchange_rates
WHERE rate_id = $1 LIMIT 1;

-- name: GetAllExchangeRates :many
SELECT * FROM exchange_rates
ORDER BY rate_id
LIMIT $1
OFFSET $2;

-- name: UpdateExchangeRate :one
UPDATE exchange_rates
SET rate_value = $2, source_currency_id = $3, destination_currency_id = $4, valid_from_date = $5, valid_to_date = $6, source_id = $7
WHERE rate_id = $1
RETURNING *;

-- name: DeleteExchangeRate :exec
DELETE FROM exchange_rates
WHERE rate_id = $1;

-- name: DeleteAllExchangeRates :exec
DELETE FROM exchange_rates;