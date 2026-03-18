-- name: CreateRateSourcePreference :one
INSERT INTO user_rate_source_preferences (
    source_id,
    user_id,
    is_primary
) VALUES (
    $1, $2, $3
) RETURNING *;

-- name: GetRateSourcePreferencesByUserID :many
SELECT * FROM user_rate_source_preferences
WHERE user_id = $1
ORDER BY is_primary DESC, created_at ASC
LIMIT $2 OFFSET $3;

-- name: GetRateSourcePreferencesBySourceID :many
SELECT ursp.* 
FROM user_rate_source_preferences ursp
INNER JOIN users u ON ursp.user_id = u.user_id
WHERE u.email = $1
ORDER BY ursp.is_primary DESC, ursp.created_at ASC
LIMIT $2 OFFSET $3;

-- name: GetAllRateSourcePreferences :many
SELECT * FROM user_rate_source_preferences
ORDER BY user_id, is_primary DESC
LIMIT $1 OFFSET $2;

-- name: UpdateRateSourcePreference :one
UPDATE user_rate_source_preferences
SET
    is_primary = COALESCE(sqlc.narg(is_primary), is_primary),
    updated_at = CURRENT_TIMESTAMP
WHERE source_id = sqlc.arg(source_id) AND user_id = sqlc.arg(user_id)
RETURNING *;

-- name: DeleteRateSourcePreference :exec
DELETE FROM user_rate_source_preferences
WHERE source_id = $1 AND user_id = $2;