-- name: CreateCountry :one
INSERT INTO countries (country_name, country_code, currency_id)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetCountryByID :one
SELECT country_id, country_name, country_code, currency_id, updated_at, created_at FROM countries 
WHERE country_id = $1 LIMIT 1;

-- name: GetCountryByCode :one
SELECT country_id, country_name, country_code, currency_id, updated_at, created_at FROM countries 
WHERE country_code = $1 LIMIT 1;

-- name: GetCountriesByCurrencyID :many
SELECT country_id, country_name, country_code, currency_id, updated_at, created_at FROM countries
WHERE currency_id = $1
ORDER BY country_id;

-- name: GetAllCountries :many
SELECT country_id, country_name, country_code, currency_id, updated_at, created_at FROM countries
ORDER BY country_id;

-- name: UpdateCountry :one
UPDATE countries
SET 
    country_name = COALESCE($2, country_name),
    country_code = COALESCE($3, country_code),
    currency_id = COALESCE($4, currency_id),
    updated_at = CURRENT_TIMESTAMP
WHERE country_id = $1
RETURNING *;

-- name: DeleteCountry :exec
DELETE FROM countries
WHERE country_id = $1;

