-- name: CreateUserSubscription :one
INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    status,
    start_date,
    end_date,
    auto_renew
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetUserSubscriptionByID :one
SELECT * FROM user_subscriptions
WHERE subscription_id = $1 LIMIT 1;

-- name: GetUserSubscriptionsByUserID :many
SELECT * FROM user_subscriptions
WHERE user_id = $1
ORDER BY start_date DESC;

-- name: GetActiveUserSubscriptionByUserID :one
SELECT * FROM user_subscriptions
WHERE user_id = $1 AND status = 'active'
ORDER BY start_date DESC
LIMIT 1;

-- name: GetUserSubscriptionsByStatus :many
SELECT * FROM user_subscriptions
WHERE status = $1
ORDER BY start_date DESC;

-- name: GetAllUserSubscriptions :many
SELECT * FROM user_subscriptions
ORDER BY start_date DESC;

-- name: UpdateUserSubscription :one
UPDATE user_subscriptions
SET
    plan_id = COALESCE(sqlc.narg(plan_id), plan_id),
    status = COALESCE(sqlc.narg(status), status),
    start_date = COALESCE(sqlc.narg(start_date), start_date),
    end_date = COALESCE(sqlc.narg(end_date), end_date),
    auto_renew = COALESCE(sqlc.narg(auto_renew), auto_renew),
    updated_at = CURRENT_TIMESTAMP
WHERE subscription_id = sqlc.arg(subscription_id)
RETURNING *;

-- name: DeleteUserSubscription :exec
DELETE FROM user_subscriptions
WHERE subscription_id = $1;