-- name: CreateCountry :one
INSERT INTO countries (country_name, currency_id)
VALUES ($1, $2)
RETURNING *;

-- name: GetCountryByID :one
SELECT * FROM countries 
WHERE country_id = $1 LIMIT 1;

-- name: GetCountriesByCurrencyID :many
SELECT * FROM countries
WHERE currency_id = $1
ORDER BY country_id;

-- name: GetAllCountries :many
SELECT * FROM countries
ORDER BY country_id
LIMIT $1
OFFSET $2;

-- name: UpdateCountry :one
UPDATE countries
SET country_name = $2, currency_id = $3, updated_at = CURRENT_TIMESTAMP
WHERE country_id = $1
RETURNING *;

-- name: DeleteCountry :exec
DELETE FROM countries
WHERE country_id = $1;

