-- name: CreateCurrency :one
INSERT INTO currencies (currency_code, currency_name, currency_symbol)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetCurrencyByID :one
SELECT currency_id, currency_code, currency_name, currency_symbol, updated_at, created_at FROM currencies 
WHERE currency_id = $1 LIMIT 1;

-- name: GetCurrencyByCode :one
SELECT currency_id, currency_code, currency_name, currency_symbol, updated_at, created_at FROM currencies 
WHERE currency_code = $1 LIMIT 1;

-- name: GetAllCurrencies :many
SELECT currency_id, currency_code, currency_name, currency_symbol, updated_at, created_at FROM currencies
ORDER BY currency_id;

-- name: UpdateCurrency :one
UPDATE currencies
SET 
    currency_code = COALESCE($2, currency_code),
    currency_name = COALESCE($3, currency_name),
    currency_symbol = COALESCE($4, currency_symbol),
    updated_at = CURRENT_TIMESTAMP
WHERE currency_id = $1
RETURNING *;

-- name: DeleteCurrency :exec
DELETE FROM currencies
WHERE currency_id = $1;