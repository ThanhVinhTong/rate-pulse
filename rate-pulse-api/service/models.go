package service

import (
	"time"

	"github.com/google/uuid"
)

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

type AuthUser struct {
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

type SignInResult struct {
	SessionID             uuid.UUID
	AccessToken           string
	AccessTokenExpiresAt  time.Time
	RefreshToken          string
	RefreshTokenExpiresAt time.Time
	User                  AuthUser
}

type RenewAccessTokenResult struct {
	AccessToken          string
	AccessTokenExpiresAt time.Time
}
