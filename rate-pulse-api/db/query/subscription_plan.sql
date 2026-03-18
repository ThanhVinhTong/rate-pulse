-- name: CreateSubscriptionPlan :one
INSERT INTO subscription_plans (
    plan_name,
    plan_price,
    historical_days,
    rate_limit_per_day,
    features,
    is_active
) VALUES (
    $1, $2, $3, $4, $5, $6
) RETURNING *;

-- name: GetSubscriptionPlanByID :one
SELECT * FROM subscription_plans
WHERE plan_id = $1 LIMIT 1;

-- name: GetSubscriptionPlanByName :one
SELECT * FROM subscription_plans
WHERE plan_name = $1 LIMIT 1;

-- name: GetAllSubscriptionPlans :many
SELECT * FROM subscription_plans
ORDER BY plan_price ASC;

-- name: GetActiveSubscriptionPlans :many
SELECT * FROM subscription_plans
WHERE is_active = true
ORDER BY plan_price ASC;

-- name: UpdateSubscriptionPlan :one
UPDATE subscription_plans
SET
    plan_name = COALESCE(sqlc.narg(plan_name), plan_name),
    plan_price = COALESCE(sqlc.narg(plan_price), plan_price),
    historical_days = COALESCE(sqlc.narg(historical_days), historical_days),
    rate_limit_per_day = COALESCE(sqlc.narg(rate_limit_per_day), rate_limit_per_day),
    features = COALESCE(sqlc.narg(features), features),
    is_active = COALESCE(sqlc.narg(is_active), is_active),
    updated_at = CURRENT_TIMESTAMP
WHERE plan_id = sqlc.arg(plan_id)
RETURNING *;

-- name: DeleteSubscriptionPlan :exec
DELETE FROM subscription_plans
WHERE plan_id = $1;