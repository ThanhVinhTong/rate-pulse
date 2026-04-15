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

-- name: GetAllExchangeRatesTodayNormalised :many
WITH ranked AS (
  SELECT
    er.rate_id,
    er.rate_value,
    sc.currency_code AS source_currency_code,
    dc.currency_code AS destination_currency_code,
    er.valid_from_date,
    rs.source_code AS rate_source_code,
    ert.type_name   AS type_name,
    er.updated_at as updated_at,

    ROW_NUMBER() OVER (
      PARTITION BY
        er.destination_currency_id,
        er.source_id,
        er.type_id
      ORDER BY
        er.updated_at DESC NULLS LAST
    ) AS rn
  FROM exchange_rates er
  JOIN currencies sc
    ON er.source_currency_id = sc.currency_id
  JOIN currencies dc
    ON er.destination_currency_id = dc.currency_id
  LEFT JOIN rate_sources rs
    ON er.source_id = rs.source_id
  LEFT JOIN exchange_rate_types ert
    ON er.type_id = ert.type_id
  WHERE er.source_currency_id = $1
)
SELECT
  rate_id,
  rate_value,
  source_currency_code,
  destination_currency_code,
  valid_from_date,
  rate_source_code,
  type_name,
  updated_at
FROM ranked
WHERE rn = 1
ORDER BY rate_id DESC
LIMIT $2;

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

-- name: GetChartData :many
-- Fetches evenly distributed exchange rate data points across a time range.
-- Returns up to num_data_points evenly spaced samples from the time range [start_time, now).
-- Parameters:
--   $1: source_currency_id
--   $2: destination_currency_id
--   $3: source_id
--   $4: start_time (UpdatedAt in struct)
--   $5: num_data_points (Ntile in struct)
WITH bucketed AS (
  SELECT 
    er.rate_value,
    er.updated_at,
    er.type_id,
    NTILE($5) OVER (ORDER BY er.updated_at) AS bucket
  FROM exchange_rates er
  WHERE er.source_currency_id = $1
    AND er.destination_currency_id = $2
    AND er.source_id = $3
    AND er.updated_at >= $4
)
SELECT DISTINCT ON (bucket) rate_value, updated_at, type_id
FROM bucketed
ORDER BY bucket, updated_at DESC;
