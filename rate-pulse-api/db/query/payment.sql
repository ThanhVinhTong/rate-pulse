-- name: CreatePayment :one
INSERT INTO payments (
    user_id,
    subscription_id,
    transaction_id,
    amount,
    currency,
    payment_method,
    payment_status,
    payment_date
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
) RETURNING *;

-- name: GetPaymentByID :one
SELECT * FROM payments
WHERE payment_id = $1 LIMIT 1;

-- name: GetPaymentByTransactionID :one
SELECT * FROM payments
WHERE transaction_id = $1 LIMIT 1;

-- name: GetPaymentsByUserID :many
SELECT * FROM payments
WHERE user_id = $1
ORDER BY payment_date DESC;

-- name: GetPaymentsByStatus :many
SELECT * FROM payments
WHERE payment_status = $1
ORDER BY payment_date DESC;

-- name: GetAllPayments :many
SELECT * FROM payments
ORDER BY payment_date DESC;

-- name: UpdatePayment :one
UPDATE payments
SET
    subscription_id = COALESCE(sqlc.narg(subscription_id), subscription_id),
    transaction_id = COALESCE(sqlc.narg(transaction_id), transaction_id),
    amount = COALESCE(sqlc.narg(amount), amount),
    currency = COALESCE(sqlc.narg(currency), currency),
    payment_method = COALESCE(sqlc.narg(payment_method), payment_method),
    payment_status = COALESCE(sqlc.narg(payment_status), payment_status),
    payment_date = COALESCE(sqlc.narg(payment_date), payment_date),
    updated_at = CURRENT_TIMESTAMP
WHERE payment_id = sqlc.arg(payment_id)
RETURNING *;

-- name: DeletePayment :exec
DELETE FROM payments
WHERE payment_id = $1;