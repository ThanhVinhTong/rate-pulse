-- name: CreateRateSourceFeeRule :one
INSERT INTO rate_source_fee_rules (
    source_id,
    type_id,
    transaction_type,
    channel,
    fee_rate,
    fee_rate_min,
    fee_rate_max,
    fee_currency_id,
    fixed_fee,
    min_fee,
    max_fee,
    vat_rate,
    vat_applies,
    fee_includes_vat,
    swift_fee,
    swift_fee_currency_id,
    swift_fee_included,
    source_url,
    source_note,
    effective_from,
    effective_to
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
    $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
)
RETURNING *;

-- name: GetRateSourceFeeRuleByID :one
SELECT * FROM rate_source_fee_rules
WHERE fee_rule_id = $1
LIMIT 1;

-- name: ListRateSourceFeeRules :many
SELECT * FROM rate_source_fee_rules
ORDER BY source_id, type_id, transaction_type, channel, effective_from DESC, fee_rule_id DESC;

-- name: ListRateSourceFeeRulesBySource :many
SELECT * FROM rate_source_fee_rules
WHERE source_id = $1
ORDER BY type_id, transaction_type, channel, effective_from DESC, fee_rule_id DESC;

-- name: ListActiveRateSourceFeeRulesBySource :many
SELECT * FROM rate_source_fee_rules
WHERE source_id = $1
  AND effective_from <= $2
  AND (effective_to IS NULL OR effective_to >= $2)
ORDER BY type_id, transaction_type, channel, effective_from DESC, fee_rule_id DESC;

-- name: GetActiveRateSourceFeeRule :one
SELECT * FROM rate_source_fee_rules
WHERE source_id = $1
  AND type_id = $2
  AND transaction_type = $3
  AND channel = $4
  AND effective_from <= $5
  AND (effective_to IS NULL OR effective_to >= $5)
ORDER BY effective_from DESC, fee_rule_id DESC
LIMIT 1;

-- name: UpdateRateSourceFeeRule :one
UPDATE rate_source_fee_rules
SET
    source_id = COALESCE(sqlc.narg(source_id), source_id),
    type_id = COALESCE(sqlc.narg(type_id), type_id),
    transaction_type = COALESCE(sqlc.narg(transaction_type), transaction_type),
    channel = COALESCE(sqlc.narg(channel), channel),
    fee_rate = COALESCE(sqlc.narg(fee_rate), fee_rate),
    fee_rate_min = COALESCE(sqlc.narg(fee_rate_min), fee_rate_min),
    fee_rate_max = COALESCE(sqlc.narg(fee_rate_max), fee_rate_max),
    fee_currency_id = COALESCE(sqlc.narg(fee_currency_id), fee_currency_id),
    fixed_fee = COALESCE(sqlc.narg(fixed_fee), fixed_fee),
    min_fee = COALESCE(sqlc.narg(min_fee), min_fee),
    max_fee = COALESCE(sqlc.narg(max_fee), max_fee),
    vat_rate = COALESCE(sqlc.narg(vat_rate), vat_rate),
    vat_applies = COALESCE(sqlc.narg(vat_applies), vat_applies),
    fee_includes_vat = COALESCE(sqlc.narg(fee_includes_vat), fee_includes_vat),
    swift_fee = COALESCE(sqlc.narg(swift_fee), swift_fee),
    swift_fee_currency_id = COALESCE(sqlc.narg(swift_fee_currency_id), swift_fee_currency_id),
    swift_fee_included = COALESCE(sqlc.narg(swift_fee_included), swift_fee_included),
    source_url = COALESCE(sqlc.narg(source_url), source_url),
    source_note = COALESCE(sqlc.narg(source_note), source_note),
    effective_from = COALESCE(sqlc.narg(effective_from), effective_from),
    effective_to = COALESCE(sqlc.narg(effective_to), effective_to),
    updated_at = CURRENT_TIMESTAMP
WHERE fee_rule_id = sqlc.arg(fee_rule_id)
RETURNING *;

-- name: DeleteRateSourceFeeRule :exec
DELETE FROM rate_source_fee_rules
WHERE fee_rule_id = $1;
