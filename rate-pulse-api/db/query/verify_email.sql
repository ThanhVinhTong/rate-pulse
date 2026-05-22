-- name: CreateVerifyEmail :one
INSERT INTO verify_emails (
    user_id,
    email,
    secret_code_hash
) VALUES (
    $1, $2, $3
)
RETURNING
    id,
    user_id,
    email,
    secret_code_hash,
    is_used,
    created_at,
    expired_at;

-- name: GetVerifyEmail :one
SELECT
    id,
    user_id,
    email,
    secret_code_hash,
    is_used,
    created_at,
    expired_at
FROM verify_emails
WHERE id = $1
LIMIT 1;

-- name: UpdateVerifyEmail :one
UPDATE verify_emails
SET
    is_used = TRUE
WHERE
    id = @id
    AND user_id = @user_id
    AND secret_code_hash = @secret_code_hash
    AND is_used = FALSE
    AND expired_at > now()
RETURNING
    id,
    user_id,
    email,
    secret_code_hash,
    is_used,
    created_at,
    expired_at;

-- name: UpdateUserEmailVerified :one
UPDATE users
SET
    email_verified = TRUE,
    updated_at = CURRENT_TIMESTAMP
WHERE
    user_id = $1
RETURNING
    user_id,
    username,
    email,
    password,
    user_type,
    email_verified,
    time_zone,
    language_preference,
    country_of_residence,
    country_of_birth,
    is_active,
    created_at,
    updated_at,
    first_name,
    last_name;