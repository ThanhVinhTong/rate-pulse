-- name: CreateExchangeRateType :one
INSERT INTO exchange_rate_types (type_name)
VALUES ($1)
RETURNING *;

-- name: GetExchangeRateType :one
SELECT * FROM exchange_rate_types
WHERE type_id = $1 LIMIT 1;

-- name: GetExchangeRateTypeByName :one
SELECT * FROM exchange_rate_types
WHERE type_name = $1 LIMIT 1;

-- name: ListExchangeRateTypes :many
SELECT * FROM exchange_rate_types
ORDER BY type_name;

-- name: UpdateExchangeRateType :one
UPDATE exchange_rate_types
SET type_name = $2
WHERE type_id = $1
RETURNING *;

-- name: DeleteExchangeRateType :exec
DELETE FROM exchange_rate_types
WHERE type_id = $1;
