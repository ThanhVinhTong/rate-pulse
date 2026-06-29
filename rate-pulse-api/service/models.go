package service

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	UserID             int32
	Username           string
	Email              string
	UserType           string
	EmailVerified      bool
	TimeZone           string
	LanguagePreference string
	CountryOfResidence string
	CountryOfBirth     string
	FirstName          string
	LastName           string
	IsActive           bool
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

/*
auth service models
*/
type CreateUserInput struct {
	Username           string
	Email              string
	Password           string
	TimeZone           string
	LanguagePreference string
	CountryOfResidence string
	CountryOfBirth     string
	FirstName          string
	LastName           string
}

type SignInInput struct {
	Email     string
	Password  string
	UserAgent string
	ClientIP  string
}

type RenewAccessTokenInput struct {
	RefreshToken string
}

type VerifyEmailInput struct {
	EmailID    int64
	SecretCode string
}

type SignInResult struct {
	SessionID             uuid.UUID
	AccessToken           string
	AccessTokenExpiresAt  time.Time
	RefreshToken          string
	RefreshTokenExpiresAt time.Time
	User                  User
}

type RenewAccessTokenResult struct {
	AccessToken          string
	AccessTokenExpiresAt time.Time
}

type VerifyEmailResult struct {
	User User
}

/*
health service models
*/
type CheckHealthResult struct {
	ServiceName   string
	Status        string
	Version       string
	UptimeSeconds int64
	CheckedAt     time.Time
	Dependencies  []DependencyHealth
}

type DependencyHealth struct {
	Name    string
	Status  string
	Message string
}

/*
user service models
*/
type GetUserInput struct {
	UserID int32
}

type ListUsersInput struct {
	PageID   int32
	PageSize int32
}

type UpdateUserInput struct {
	UserID             int32
	Username           *string
	Email              *string
	Password           *string
	TimeZone           *string
	LanguagePreference *string
	CountryOfResidence *string
	CountryOfBirth     *string
	FirstName          *string
	LastName           *string
}

type AdminUpdateUserInput struct {
	UserID             int32
	Username           *string
	Email              *string
	Password           *string
	UserType           *string
	EmailVerified      *bool
	TimeZone           *string
	LanguagePreference *string
	CountryOfResidence *string
	CountryOfBirth     *string
	FirstName          *string
	LastName           *string
	IsActive           *bool
}

type DeleteUserInput struct {
	UserID int32
}

/*
fx service models
*/
type ExchangeRate struct {
	RateID                int32
	RateValue             string
	SourceCurrencyID      int32
	DestinationCurrencyID int32
	ValidFromDate         time.Time
	ValidToDate           time.Time
	SourceID              int32
	TypeID                int32
	CreatedAt             time.Time
	UpdatedAt             time.Time
}

type LatestExchangeRate struct {
	RateID                  int32
	RateValue               string
	SourceCurrencyCode      string
	DestinationCurrencyCode string
	ValidFromDate           time.Time
	RateSourceCode          string
	TypeName                string
	UpdatedAt               time.Time
}

type HistoricalDataPoint struct {
	RateValue string
	UpdatedAt time.Time
	TypeID    int32
}

type CreateExchangeRateInput struct {
	RateValue             string
	SourceCurrencyID      int32
	DestinationCurrencyID int32
	ValidFromDate         time.Time
	ValidToDate           time.Time
	SourceID              int32
	TypeID                int32
}

type GetExchangeRateInput struct {
	RateID int32
}

type ListLatestExchangeRatesInput struct {
	SourceCurrencyID int32
	Limit            int32
}

type UpdateExchangeRateInput struct {
	RateID                int32
	RateValue             *string
	SourceCurrencyID      *int32
	DestinationCurrencyID *int32
	ValidFromDate         *time.Time
	ValidToDate           *time.Time
	SourceID              *int32
	TypeID                *int32
}

type DeleteExchangeRateInput struct {
	RateID int32
}

type GetHistoricalDataInput struct {
	SourceCurrencyID      int32
	DestinationCurrencyID int32
	SourceID              int32
	TypeID                int32
	TimeRange             string
	DataPoints            int32
}

/*
rate source fee rule service models
*/
type RateSourceFeeRule struct {
	FeeRuleID          int32      `json:"fee_rule_id"`
	SourceID           int32      `json:"source_id"`
	TypeID             int32      `json:"type_id"`
	TransactionType    string     `json:"transaction_type"`
	Channel            string     `json:"channel"`
	FeeRate            *string    `json:"fee_rate"`
	FeeRateMin         *string    `json:"fee_rate_min"`
	FeeRateMax         *string    `json:"fee_rate_max"`
	FeeCurrencyID      *int32     `json:"fee_currency_id"`
	FixedFee           *string    `json:"fixed_fee"`
	MinFee             *string    `json:"min_fee"`
	MaxFee             *string    `json:"max_fee"`
	VatRate            string     `json:"vat_rate"`
	VatApplies         string     `json:"vat_applies"`
	FeeIncludesVat     bool       `json:"fee_includes_vat"`
	SwiftFee           *string    `json:"swift_fee"`
	SwiftFeeCurrencyID *int32     `json:"swift_fee_currency_id"`
	SwiftFeeIncluded   bool       `json:"swift_fee_included"`
	SourceURL          *string    `json:"source_url"`
	SourceNote         *string    `json:"source_note"`
	EffectiveFrom      time.Time  `json:"effective_from"`
	EffectiveTo        *time.Time `json:"effective_to"`
	UpdatedAt          *time.Time `json:"updated_at"`
	CreatedAt          *time.Time `json:"created_at"`
}

type CreateRateSourceFeeRuleInput struct {
	SourceID           int32
	TypeID             int32
	TransactionType    string
	Channel            string
	FeeRate            *string
	FeeRateMin         *string
	FeeRateMax         *string
	FeeCurrencyID      *int32
	FixedFee           *string
	MinFee             *string
	MaxFee             *string
	VatRate            *string
	VatApplies         string
	FeeIncludesVat     bool
	SwiftFee           *string
	SwiftFeeCurrencyID *int32
	SwiftFeeIncluded   bool
	SourceURL          *string
	SourceNote         *string
	EffectiveFrom      time.Time
	EffectiveTo        *time.Time
}

type GetRateSourceFeeRuleInput struct {
	FeeRuleID int32
}

type ListRateSourceFeeRulesInput struct {
	SourceID *int32
	ActiveOn *time.Time
}

type GetActiveRateSourceFeeRuleInput struct {
	SourceID        int32
	TypeID          int32
	TransactionType string
	Channel         string
	EffectiveDate   time.Time
}

type UpdateRateSourceFeeRuleInput struct {
	FeeRuleID          int32
	SourceID           *int32
	TypeID             *int32
	TransactionType    *string
	Channel            *string
	FeeRate            *string
	FeeRateMin         *string
	FeeRateMax         *string
	FeeCurrencyID      *int32
	FixedFee           *string
	MinFee             *string
	MaxFee             *string
	VatRate            *string
	VatApplies         *string
	FeeIncludesVat     *bool
	SwiftFee           *string
	SwiftFeeCurrencyID *int32
	SwiftFeeIncluded   *bool
	SourceURL          *string
	SourceNote         *string
	EffectiveFrom      *time.Time
	EffectiveTo        *time.Time
}

type DeleteRateSourceFeeRuleInput struct {
	FeeRuleID int32
}
