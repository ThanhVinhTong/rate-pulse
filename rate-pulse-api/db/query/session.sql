-- name: CreateSession :one
INSERT INTO sessions (
    session_id,
    user_id,
    refresh_token,
    user_agent,
    client_ip,
    is_blocked,
    expires_at
) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- name: GetSessionByID :one
SELECT * FROM sessions
WHERE session_id = $1 LIMIT 1;