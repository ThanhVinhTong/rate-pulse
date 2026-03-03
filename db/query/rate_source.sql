-- name: CreateRateSource :one
INSERT INTO rate_sources (source_name, source_link, source_country, source_status)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetRateSourceByID :one
SELECT * FROM rate_sources
WHERE source_id = $1 LIMIT 1;

-- name: GetAllRateSources :many
SELECT * FROM rate_sources
ORDER BY source_id
LIMIT $1
OFFSET $2;

-- name: UpdateRateSource :one
UPDATE rate_sources
SET 
    source_name = COALESCE($2, source_name),
    source_link = COALESCE($3, source_link),
    source_country = COALESCE($4, source_country),
    source_status = COALESCE($5, source_status)
WHERE source_id = $1
RETURNING *;

-- name: DeleteRateSource :exec
DELETE FROM rate_sources
WHERE source_id = $1;