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
