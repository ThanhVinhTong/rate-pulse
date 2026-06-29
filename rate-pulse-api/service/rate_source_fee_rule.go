package service

import (
	"context"
	"database/sql"
	"errors"
	"math"
	"strconv"
	"strings"
	"time"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/lib/pq"
)

type RateSourceFeeRuleService struct {
	store db.Store
}

func NewRateSourceFeeRuleService(store db.Store) *RateSourceFeeRuleService {
	return &RateSourceFeeRuleService{store: store}
}

func (s *RateSourceFeeRuleService) CreateRateSourceFeeRule(ctx context.Context, input CreateRateSourceFeeRuleInput) (RateSourceFeeRule, error) {
	if err := validateCreateRateSourceFeeRuleInput(input); err != nil {
		return RateSourceFeeRule{}, err
	}

	transactionType := normalizeTransactionType(input.TransactionType)
	channel := normalizeChannel(input.Channel)
	vatRate := normalizeVATRate(input.VatRate)
	vatApplies := normalizeVatApplies(input.VatApplies)

	rule, err := s.store.CreateRateSourceFeeRule(ctx, db.CreateRateSourceFeeRuleParams{
		SourceID:           input.SourceID,
		TypeID:             input.TypeID,
		TransactionType:    transactionType,
		Channel:            channel,
		FeeRate:            optionalString(input.FeeRate),
		FeeRateMin:         optionalString(input.FeeRateMin),
		FeeRateMax:         optionalString(input.FeeRateMax),
		FeeCurrencyID:      optionalInt32(input.FeeCurrencyID),
		FixedFee:           optionalString(input.FixedFee),
		MinFee:             optionalString(input.MinFee),
		MaxFee:             optionalString(input.MaxFee),
		VatRate:            vatRate,
		VatApplies:         vatApplies,
		FeeIncludesVat:     input.FeeIncludesVat,
		SwiftFee:           optionalString(input.SwiftFee),
		SwiftFeeCurrencyID: optionalInt32(input.SwiftFeeCurrencyID),
		SwiftFeeIncluded:   input.SwiftFeeIncluded,
		SourceUrl:          optionalString(input.SourceURL),
		SourceNote:         optionalString(input.SourceNote),
		EffectiveFrom:      startOfDay(input.EffectiveFrom),
		EffectiveTo:        optionalTime(input.EffectiveTo),
	})
	if err != nil {
		return RateSourceFeeRule{}, wrapRateSourceFeeRuleDBError(err, "failed to create rate source fee rule")
	}

	return NewRateSourceFeeRule(rule), nil
}

func (s *RateSourceFeeRuleService) GetRateSourceFeeRule(ctx context.Context, input GetRateSourceFeeRuleInput) (RateSourceFeeRule, error) {
	if input.FeeRuleID <= 0 {
		return RateSourceFeeRule{}, Wrap(nil, ErrInvalidInput.Code, "fee_rule_id must be greater than 0")
	}

	rule, err := s.store.GetRateSourceFeeRuleByID(ctx, input.FeeRuleID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return RateSourceFeeRule{}, Wrap(err, ErrNotFound.Code, "rate source fee rule not found")
		}
		return RateSourceFeeRule{}, Wrap(err, ErrInternal.Code, "failed to get rate source fee rule")
	}

	return NewRateSourceFeeRule(rule), nil
}

func (s *RateSourceFeeRuleService) ListRateSourceFeeRules(ctx context.Context, input ListRateSourceFeeRulesInput) ([]RateSourceFeeRule, error) {
	if input.SourceID != nil && *input.SourceID <= 0 {
		return nil, Wrap(nil, ErrInvalidInput.Code, "source_id must be greater than 0")
	}

	var (
		rules []db.RateSourceFeeRule
		err   error
	)

	if input.SourceID != nil && input.ActiveOn != nil {
		rules, err = s.store.ListActiveRateSourceFeeRulesBySource(ctx, db.ListActiveRateSourceFeeRulesBySourceParams{
			SourceID:      *input.SourceID,
			EffectiveFrom: startOfDay(*input.ActiveOn),
		})
	} else if input.SourceID != nil {
		rules, err = s.store.ListRateSourceFeeRulesBySource(ctx, *input.SourceID)
	} else {
		rules, err = s.store.ListRateSourceFeeRules(ctx)
		if err == nil && input.ActiveOn != nil {
			rules = filterActiveRateSourceFeeRules(rules, *input.ActiveOn)
		}
	}
	if err != nil {
		return nil, Wrap(err, ErrInternal.Code, "failed to list rate source fee rules")
	}

	return NewRateSourceFeeRules(rules), nil
}

func (s *RateSourceFeeRuleService) GetActiveRateSourceFeeRule(ctx context.Context, input GetActiveRateSourceFeeRuleInput) (RateSourceFeeRule, error) {
	if input.SourceID <= 0 {
		return RateSourceFeeRule{}, Wrap(nil, ErrInvalidInput.Code, "source_id must be greater than 0")
	}
	if input.TypeID <= 0 {
		return RateSourceFeeRule{}, Wrap(nil, ErrInvalidInput.Code, "type_id must be greater than 0")
	}
	transactionType := normalizeTransactionType(input.TransactionType)
	if err := validateTransactionType(transactionType); err != nil {
		return RateSourceFeeRule{}, err
	}
	channel := normalizeChannel(input.Channel)
	if channel == "" {
		return RateSourceFeeRule{}, Wrap(nil, ErrInvalidInput.Code, "channel is required")
	}
	if input.EffectiveDate.IsZero() {
		return RateSourceFeeRule{}, Wrap(nil, ErrInvalidInput.Code, "effective_date is required")
	}

	rule, err := s.store.GetActiveRateSourceFeeRule(ctx, db.GetActiveRateSourceFeeRuleParams{
		SourceID:        input.SourceID,
		TypeID:          input.TypeID,
		TransactionType: transactionType,
		Channel:         channel,
		EffectiveFrom:   startOfDay(input.EffectiveDate),
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return RateSourceFeeRule{}, Wrap(err, ErrNotFound.Code, "active rate source fee rule not found")
		}
		return RateSourceFeeRule{}, Wrap(err, ErrInternal.Code, "failed to get active rate source fee rule")
	}

	return NewRateSourceFeeRule(rule), nil
}

func (s *RateSourceFeeRuleService) UpdateRateSourceFeeRule(ctx context.Context, input UpdateRateSourceFeeRuleInput) (RateSourceFeeRule, error) {
	if err := validateUpdateRateSourceFeeRuleInput(input); err != nil {
		return RateSourceFeeRule{}, err
	}

	rule, err := s.store.UpdateRateSourceFeeRule(ctx, db.UpdateRateSourceFeeRuleParams{
		FeeRuleID:          input.FeeRuleID,
		SourceID:           optionalInt32(input.SourceID),
		TypeID:             optionalInt32(input.TypeID),
		TransactionType:    optionalNormalizedString(input.TransactionType, normalizeTransactionType),
		Channel:            optionalNormalizedString(input.Channel, normalizeChannel),
		FeeRate:            optionalString(input.FeeRate),
		FeeRateMin:         optionalString(input.FeeRateMin),
		FeeRateMax:         optionalString(input.FeeRateMax),
		FeeCurrencyID:      optionalInt32(input.FeeCurrencyID),
		FixedFee:           optionalString(input.FixedFee),
		MinFee:             optionalString(input.MinFee),
		MaxFee:             optionalString(input.MaxFee),
		VatRate:            optionalString(input.VatRate),
		VatApplies:         optionalNormalizedString(input.VatApplies, normalizeVatApplies),
		FeeIncludesVat:     optionalBool(input.FeeIncludesVat),
		SwiftFee:           optionalString(input.SwiftFee),
		SwiftFeeCurrencyID: optionalInt32(input.SwiftFeeCurrencyID),
		SwiftFeeIncluded:   optionalBool(input.SwiftFeeIncluded),
		SourceUrl:          optionalString(input.SourceURL),
		SourceNote:         optionalString(input.SourceNote),
		EffectiveFrom:      optionalTime(input.EffectiveFrom),
		EffectiveTo:        optionalTime(input.EffectiveTo),
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return RateSourceFeeRule{}, Wrap(err, ErrNotFound.Code, "rate source fee rule not found")
		}
		return RateSourceFeeRule{}, wrapRateSourceFeeRuleDBError(err, "failed to update rate source fee rule")
	}

	return NewRateSourceFeeRule(rule), nil
}

func (s *RateSourceFeeRuleService) DeleteRateSourceFeeRule(ctx context.Context, input DeleteRateSourceFeeRuleInput) error {
	if input.FeeRuleID <= 0 {
		return Wrap(nil, ErrInvalidInput.Code, "fee_rule_id must be greater than 0")
	}

	if err := s.store.DeleteRateSourceFeeRule(ctx, input.FeeRuleID); err != nil {
		return Wrap(err, ErrInternal.Code, "failed to delete rate source fee rule")
	}
	return nil
}

func validateCreateRateSourceFeeRuleInput(input CreateRateSourceFeeRuleInput) error {
	if input.SourceID <= 0 {
		return Wrap(nil, ErrInvalidInput.Code, "source_id must be greater than 0")
	}
	if input.TypeID <= 0 {
		return Wrap(nil, ErrInvalidInput.Code, "type_id must be greater than 0")
	}
	if err := validateTransactionType(normalizeTransactionType(input.TransactionType)); err != nil {
		return err
	}
	if input.EffectiveFrom.IsZero() {
		return Wrap(nil, ErrInvalidInput.Code, "effective_from is required")
	}
	if input.EffectiveTo != nil && startOfDay(*input.EffectiveTo).Before(startOfDay(input.EffectiveFrom)) {
		return Wrap(nil, ErrInvalidInput.Code, "effective_to must be on or after effective_from")
	}
	return validateRateSourceFeeRuleNumbers(
		input.FeeRate,
		input.FeeRateMin,
		input.FeeRateMax,
		input.FixedFee,
		input.MinFee,
		input.MaxFee,
		input.VatRate,
		input.SwiftFee,
		input.FeeCurrencyID,
		input.SwiftFeeCurrencyID,
		input.SwiftFeeIncluded,
		input.VatApplies,
	)
}

func validateUpdateRateSourceFeeRuleInput(input UpdateRateSourceFeeRuleInput) error {
	if input.FeeRuleID <= 0 {
		return Wrap(nil, ErrInvalidInput.Code, "fee_rule_id must be greater than 0")
	}
	if input.SourceID != nil && *input.SourceID <= 0 {
		return Wrap(nil, ErrInvalidInput.Code, "source_id must be greater than 0")
	}
	if input.TypeID != nil && *input.TypeID <= 0 {
		return Wrap(nil, ErrInvalidInput.Code, "type_id must be greater than 0")
	}
	if input.TransactionType != nil {
		if err := validateTransactionType(normalizeTransactionType(*input.TransactionType)); err != nil {
			return err
		}
	}
	if input.Channel != nil && normalizeChannel(*input.Channel) == "" {
		return Wrap(nil, ErrInvalidInput.Code, "channel is required")
	}
	if input.EffectiveFrom != nil && input.EffectiveFrom.IsZero() {
		return Wrap(nil, ErrInvalidInput.Code, "effective_from is required")
	}
	if input.EffectiveFrom != nil && input.EffectiveTo != nil && startOfDay(*input.EffectiveTo).Before(startOfDay(*input.EffectiveFrom)) {
		return Wrap(nil, ErrInvalidInput.Code, "effective_to must be on or after effective_from")
	}
	vatApplies := ""
	if input.VatApplies != nil {
		vatApplies = *input.VatApplies
	}
	return validateRateSourceFeeRuleNumbers(
		input.FeeRate,
		input.FeeRateMin,
		input.FeeRateMax,
		input.FixedFee,
		input.MinFee,
		input.MaxFee,
		input.VatRate,
		input.SwiftFee,
		input.FeeCurrencyID,
		input.SwiftFeeCurrencyID,
		input.SwiftFeeIncluded != nil && *input.SwiftFeeIncluded,
		vatApplies,
	)
}

func validateRateSourceFeeRuleNumbers(
	feeRate,
	feeRateMin,
	feeRateMax,
	fixedFee,
	minFee,
	maxFee,
	vatRate,
	swiftFee *string,
	feeCurrencyID,
	swiftFeeCurrencyID *int32,
	swiftFeeIncluded bool,
	vatApplies string,
) error {
	for field, value := range map[string]*string{
		"fee_rate":     feeRate,
		"fee_rate_min": feeRateMin,
		"fee_rate_max": feeRateMax,
		"fixed_fee":    fixedFee,
		"min_fee":      minFee,
		"max_fee":      maxFee,
		"vat_rate":     vatRate,
		"swift_fee":    swiftFee,
	} {
		if err := validateNonNegativeDecimal(field, value); err != nil {
			return err
		}
	}
	if hasValue(feeRate) && (hasValue(feeRateMin) || hasValue(feeRateMax)) {
		return Wrap(nil, ErrInvalidInput.Code, "fee_rate cannot be combined with fee_rate_min or fee_rate_max")
	}
	if hasValue(feeRateMin) && hasValue(feeRateMax) {
		min, _ := parseDecimal(*feeRateMin)
		max, _ := parseDecimal(*feeRateMax)
		if max < min {
			return Wrap(nil, ErrInvalidInput.Code, "fee_rate_max must be greater than or equal to fee_rate_min")
		}
	}
	if hasValue(minFee) && hasValue(maxFee) {
		min, _ := parseDecimal(*minFee)
		max, _ := parseDecimal(*maxFee)
		if max < min {
			return Wrap(nil, ErrInvalidInput.Code, "max_fee must be greater than or equal to min_fee")
		}
	}
	if (hasValue(fixedFee) || hasValue(minFee) || hasValue(maxFee)) && (feeCurrencyID == nil || *feeCurrencyID <= 0) {
		return Wrap(nil, ErrInvalidInput.Code, "fee_currency_id is required when fixed_fee, min_fee, or max_fee is set")
	}
	if hasValue(swiftFee) && (swiftFeeCurrencyID == nil || *swiftFeeCurrencyID <= 0) {
		return Wrap(nil, ErrInvalidInput.Code, "swift_fee_currency_id is required when swift_fee is set")
	}
	if swiftFeeCurrencyID != nil && *swiftFeeCurrencyID <= 0 {
		return Wrap(nil, ErrInvalidInput.Code, "swift_fee_currency_id must be greater than 0")
	}
	if swiftFeeIncluded && hasValue(swiftFee) {
		return Wrap(nil, ErrInvalidInput.Code, "swift_fee must be empty when swift_fee_included is true")
	}
	if feeCurrencyID != nil && *feeCurrencyID <= 0 {
		return Wrap(nil, ErrInvalidInput.Code, "fee_currency_id must be greater than 0")
	}
	if err := validateVatApplies(normalizeVatApplies(vatApplies)); err != nil {
		return err
	}
	return nil
}

func validateTransactionType(value string) error {
	switch value {
	case "transfer", "cash", "cheque", "card", "unknown":
		return nil
	default:
		return Wrap(nil, ErrInvalidInput.Code, "transaction_type must be one of transfer, cash, cheque, card, unknown")
	}
}

func validateVatApplies(value string) error {
	switch value {
	case "true", "false", "unknown":
		return nil
	default:
		return Wrap(nil, ErrInvalidInput.Code, "vat_applies must be one of true, false, unknown")
	}
}

func validateNonNegativeDecimal(field string, value *string) error {
	if !hasValue(value) {
		return nil
	}
	parsed, err := parseDecimal(*value)
	if err != nil || parsed < 0 {
		return Wrap(nil, ErrInvalidInput.Code, field+" must be a non-negative decimal")
	}
	return nil
}

func parseDecimal(value string) (float64, error) {
	parsed, err := strconv.ParseFloat(strings.TrimSpace(value), 64)
	if err != nil {
		return 0, err
	}
	if math.IsNaN(parsed) || math.IsInf(parsed, 0) {
		return 0, errors.New("invalid decimal")
	}
	return parsed, nil
}

func filterActiveRateSourceFeeRules(rules []db.RateSourceFeeRule, activeOn time.Time) []db.RateSourceFeeRule {
	date := startOfDay(activeOn)
	active := make([]db.RateSourceFeeRule, 0, len(rules))
	for _, rule := range rules {
		if rule.EffectiveFrom.After(date) {
			continue
		}
		if rule.EffectiveTo.Valid && rule.EffectiveTo.Time.Before(date) {
			continue
		}
		active = append(active, rule)
	}
	return active
}

func normalizeTransactionType(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value == "" {
		return "transfer"
	}
	return value
}

func normalizeChannel(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value == "" {
		return "default"
	}
	return value
}

func normalizeVatApplies(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value == "" {
		return "unknown"
	}
	return value
}

func normalizeVATRate(value *string) string {
	if !hasValue(value) {
		return "0.1"
	}
	return strings.TrimSpace(*value)
}

func hasValue(value *string) bool {
	return value != nil && strings.TrimSpace(*value) != ""
}

func optionalString(value *string) sql.NullString {
	if value == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: strings.TrimSpace(*value), Valid: strings.TrimSpace(*value) != ""}
}

func optionalNormalizedString(value *string, normalize func(string) string) sql.NullString {
	if value == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: normalize(*value), Valid: true}
}

func optionalInt32(value *int32) sql.NullInt32 {
	if value == nil {
		return sql.NullInt32{}
	}
	return sql.NullInt32{Int32: *value, Valid: true}
}

func optionalBool(value *bool) sql.NullBool {
	if value == nil {
		return sql.NullBool{}
	}
	return sql.NullBool{Bool: *value, Valid: true}
}

func optionalTime(value *time.Time) sql.NullTime {
	if value == nil || value.IsZero() {
		return sql.NullTime{}
	}
	return sql.NullTime{Time: startOfDay(*value), Valid: true}
}

func startOfDay(value time.Time) time.Time {
	return time.Date(value.Year(), value.Month(), value.Day(), 0, 0, 0, 0, value.Location())
}

func wrapRateSourceFeeRuleDBError(err error, defaultMessage string) error {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) {
		switch pqErr.Code {
		case "23503":
			return Wrap(err, ErrInvalidInput.Code, "invalid reference id")
		case "23514":
			return Wrap(err, ErrInvalidInput.Code, "rate source fee rule violates database constraints")
		}
	}
	return Wrap(err, ErrInternal.Code, defaultMessage)
}
