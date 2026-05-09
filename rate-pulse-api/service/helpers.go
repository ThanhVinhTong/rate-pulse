package service

import db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"

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
