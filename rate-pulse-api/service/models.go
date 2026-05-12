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
