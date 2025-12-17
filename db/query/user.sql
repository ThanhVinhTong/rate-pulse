-- name: CreateUser :one
INSERT INTO users (
    username,
    email,
    password,
    user_type,
    email_verified,
    time_zone,
    language_preference,
    country_of_residence,
    country_of_birth,
    is_active
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
) RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users
WHERE user_id = $1 LIMIT 1;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 LIMIT 1;

-- name: GetAllUsers :many
SELECT * FROM users
ORDER BY created_at DESC;

-- name: UpdateUser :one
UPDATE users
SET
    username = COALESCE(sqlc.narg(username), username),
    email = COALESCE(sqlc.narg(email), email),
    password = COALESCE(sqlc.narg(password), password),
    user_type = COALESCE(sqlc.narg(user_type), user_type),
    email_verified = COALESCE(sqlc.narg(email_verified), email_verified),
    time_zone = COALESCE(sqlc.narg(time_zone), time_zone),
    language_preference = COALESCE(sqlc.narg(language_preference), language_preference),
    country_of_residence = COALESCE(sqlc.narg(country_of_residence), country_of_residence),
    country_of_birth = COALESCE(sqlc.narg(country_of_birth), country_of_birth),
    is_active = COALESCE(sqlc.narg(is_active), is_active),
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = sqlc.arg(user_id)
RETURNING *;

-- name: DeleteUserByID :exec
DELETE FROM users
WHERE user_id = $1;

-- name: DeleteUserByEmail :exec
DELETE FROM users
WHERE email = $1;