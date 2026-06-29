package service

import (
	"database/sql"
	"time"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
)

/*
	Helper function to create a new User from a db.User.
*/
func NewUser(user db.User) User {
	return User{
		UserID:             user.UserID,
		Username:           user.Username,
		Email:              user.Email,
		UserType:           user.UserType.String,
		EmailVerified:      user.EmailVerified.Bool,
		TimeZone:           user.TimeZone.String,
		LanguagePreference: user.LanguagePreference.String,
		CountryOfResidence: user.CountryOfResidence.String,
		CountryOfBirth:     user.CountryOfBirth.String,
		FirstName:          user.FirstName.String,
		LastName:           user.LastName.String,
		IsActive:           user.IsActive.Bool,
		CreatedAt:          user.CreatedAt.Time,
		UpdatedAt:          user.UpdatedAt.Time,
	}
}

/*
	Helper function to create a new ExchangeRate from a db.ExchangeRate.
*/
func NewExchangeRate(rate db.ExchangeRate) ExchangeRate {
	return ExchangeRate{
		RateID:                rate.RateID,
		RateValue:             rate.RateValue,
		SourceCurrencyID:      rate.SourceCurrencyID,
		DestinationCurrencyID: rate.DestinationCurrencyID,
		ValidFromDate:         rate.ValidFromDate,
		ValidToDate:           rate.ValidToDate.Time,
		SourceID:              rate.SourceID.Int32,
		TypeID:                rate.TypeID.Int32,
		CreatedAt:             rate.CreatedAt.Time,
		UpdatedAt:             rate.UpdatedAt.Time,
	}
}

func NewExchangeRateFromGetRow(rate db.GetExchangeRateByIDRow) ExchangeRate {
	return ExchangeRate{
		RateID:                rate.RateID,
		RateValue:             rate.RateValue,
		SourceCurrencyID:      rate.SourceCurrencyID,
		DestinationCurrencyID: rate.DestinationCurrencyID,
		ValidFromDate:         rate.ValidFromDate,
		ValidToDate:           rate.ValidToDate.Time,
		SourceID:              rate.SourceID.Int32,
		TypeID:                rate.TypeID.Int32,
		CreatedAt:             rate.CreatedAt.Time,
		UpdatedAt:             rate.UpdatedAt.Time,
	}
}

func NewLatestExchangeRate(rate db.GetAllExchangeRatesTodayNormalisedRow) LatestExchangeRate {
	return LatestExchangeRate{
		RateID:                  rate.RateID,
		RateValue:               rate.RateValue,
		SourceCurrencyCode:      rate.SourceCurrencyCode,
		DestinationCurrencyCode: rate.DestinationCurrencyCode,
		ValidFromDate:           rate.ValidFromDate,
		RateSourceCode:          rate.RateSourceCode.String,
		TypeName:                rate.TypeName.String,
		UpdatedAt:               rate.UpdatedAt.Time,
	}
}

func NewHistoricalDataPoint(point db.GetHistoricalDataRow) HistoricalDataPoint {
	return HistoricalDataPoint{
		RateValue: point.RateValue,
		UpdatedAt: point.UpdatedAt.Time,
		TypeID:    point.TypeID.Int32,
	}
}

func NewRateSourceFeeRule(rule db.RateSourceFeeRule) RateSourceFeeRule {
	return RateSourceFeeRule{
		FeeRuleID:          rule.FeeRuleID,
		SourceID:           rule.SourceID,
		TypeID:             rule.TypeID,
		TransactionType:    rule.TransactionType,
		Channel:            rule.Channel,
		FeeRate:            nullStringPtr(rule.FeeRate),
		FeeRateMin:         nullStringPtr(rule.FeeRateMin),
		FeeRateMax:         nullStringPtr(rule.FeeRateMax),
		FeeCurrencyID:      nullInt32Ptr(rule.FeeCurrencyID),
		FixedFee:           nullStringPtr(rule.FixedFee),
		MinFee:             nullStringPtr(rule.MinFee),
		MaxFee:             nullStringPtr(rule.MaxFee),
		VatRate:            rule.VatRate,
		VatApplies:         rule.VatApplies,
		FeeIncludesVat:     rule.FeeIncludesVat,
		SwiftFee:           nullStringPtr(rule.SwiftFee),
		SwiftFeeCurrencyID: nullInt32Ptr(rule.SwiftFeeCurrencyID),
		SwiftFeeIncluded:   rule.SwiftFeeIncluded,
		SourceURL:          nullStringPtr(rule.SourceUrl),
		SourceNote:         nullStringPtr(rule.SourceNote),
		EffectiveFrom:      rule.EffectiveFrom,
		EffectiveTo:        nullTimePtr(rule.EffectiveTo),
		UpdatedAt:          nullTimePtr(rule.UpdatedAt),
		CreatedAt:          nullTimePtr(rule.CreatedAt),
	}
}

func NewRateSourceFeeRules(rules []db.RateSourceFeeRule) []RateSourceFeeRule {
	res := make([]RateSourceFeeRule, len(rules))
	for i, rule := range rules {
		res[i] = NewRateSourceFeeRule(rule)
	}
	return res
}

func nullStringPtr(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}

func nullInt32Ptr(value sql.NullInt32) *int32 {
	if !value.Valid {
		return nil
	}
	return &value.Int32
}

func nullTimePtr(value sql.NullTime) *time.Time {
	if !value.Valid {
		return nil
	}
	return &value.Time
}
