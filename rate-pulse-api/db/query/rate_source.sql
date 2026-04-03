-- name: CreateRateSource :one
INSERT INTO rate_sources (source_name, source_link, source_country, source_status, source_code)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetRateSourceByID :one
SELECT source_id, source_name, source_link, source_country, source_status, updated_at, created_at, source_code FROM rate_sources
WHERE source_id = $1 LIMIT 1;

-- name: GetRateSourceByCode :one
SELECT source_id, source_name, source_link, source_country, source_status, updated_at, created_at, source_code FROM rate_sources
WHERE source_code = $1 LIMIT 1;

-- name: GetAllRateSources :many
SELECT source_id, source_name, source_link, source_country, source_status, updated_at, created_at, source_code FROM rate_sources
ORDER BY source_id;

-- name: UpdateRateSource :one
UPDATE rate_sources
SET 
    source_name = COALESCE($2, source_name),
    source_link = COALESCE($3, source_link),
    source_country = COALESCE($4, source_country),
    source_status = COALESCE($5, source_status),
    source_code = COALESCE($6, source_code)
WHERE source_id = $1
RETURNING *;

-- name: DeleteRateSource :exec
DELETE FROM rate_sources
WHERE source_id = $1;