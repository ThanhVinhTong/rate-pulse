-- name: CreateCurrencyPreference :one
INSERT INTO user_currency_preferences (
    currency_id,
    user_id,
    is_favorite,
    display_order
) VALUES (
    $1, $2, $3, $4
) RETURNING *;

-- name: GetCurrencyPreferencesByUserID :many
SELECT * FROM user_currency_preferences
WHERE user_id = $1
ORDER BY display_order ASC, created_at ASC
LIMIT $2 OFFSET $3;

-- name: GetCurrencyPreferencesByCurrencyID :many
SELECT * FROM user_currency_preferences
WHERE currency_id = $1
ORDER BY user_id ASC
LIMIT $2 OFFSET $3;

-- name: GetAllCurrencyPreferences :many
SELECT * FROM user_currency_preferences
ORDER BY user_id, display_order ASC
LIMIT $1 OFFSET $2;

-- name: UpdateCurrencyPreference :one
UPDATE user_currency_preferences
SET
    is_favorite = COALESCE(sqlc.narg(is_favorite), is_favorite),
    display_order = COALESCE(sqlc.narg(display_order), display_order),
    updated_at = CURRENT_TIMESTAMP
WHERE currency_id = sqlc.arg(currency_id) AND user_id = sqlc.arg(user_id)
RETURNING *;

-- name: DeleteCurrencyPreference :exec
DELETE FROM user_currency_preferences
WHERE currency_id = $1 AND user_id = $2;