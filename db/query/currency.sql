-- name: CreateCurrency :one
INSERT INTO currencies (currency_code, currency_name, currency_symbol)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetCurrencyByID :one
SELECT * FROM currencies 
WHERE currency_id = $1 LIMIT 1;

-- name: GetCurrencyByCode :one
SELECT * FROM currencies 
WHERE currency_code = $1 LIMIT 1;

-- name: GetAllCurrencies :many
SELECT * FROM currencies
ORDER BY currency_id
LIMIT $1
OFFSET $2;

-- name: UpdateCurrency :one
UPDATE currencies
SET currency_code = $2, currency_name = $3, currency_symbol = $4, updated_at = CURRENT_TIMESTAMP
WHERE currency_id = $1
RETURNING *;

-- name: DeleteCurrency :exec
DELETE FROM currencies
WHERE currency_id = $1;