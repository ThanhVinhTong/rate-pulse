package gapi

import (
	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	pb "github.com/ThanhVinhTong/rate-pulse/pb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func convertUser(user db.User) *pb.User {
	var createdAt = timestamppb.New(user.CreatedAt.Time)
	var updatedAt = timestamppb.New(user.UpdatedAt.Time)

	print(createdAt)
	print(updatedAt)
	// free, premium, enterprise, admin
	userType := "free"
	if user.UserType.Valid {
		userType = user.UserType.String
	}

	timeZone := "utc+8"
	if user.TimeZone.Valid {
		timeZone = user.TimeZone.String
	}

	languagePreference := "en"
	if user.LanguagePreference.Valid {
		languagePreference = user.LanguagePreference.String
	}

	countryOfResidence := "au"
	if user.CountryOfResidence.Valid {
		countryOfResidence = user.CountryOfResidence.String
	}

	countryOfBirth := "au"
	if user.CountryOfBirth.Valid {
		countryOfBirth = user.CountryOfBirth.String
	}

	firstName := ""
	if user.FirstName.Valid {
		firstName = user.FirstName.String
	}

	lastName := ""
	if user.LastName.Valid {
		lastName = user.LastName.String
	}

	emailVerified := user.EmailVerified.Valid && user.EmailVerified.Bool
	isActive := user.IsActive.Valid && user.IsActive.Bool

	return &pb.User{
		UserId:             user.UserID,
		Username:           user.Username,
		Email:              user.Email,
		UserType:           userType,
		EmailVerified:      emailVerified,
		TimeZone:           timeZone,
		LanguagePreference: languagePreference,
		CountryOfResidence: countryOfResidence,
		CountryOfBirth:     countryOfBirth,
		IsActive:           isActive,
		FirstName:          firstName,
		LastName:           lastName,
		CreatedAt:          createdAt,
		UpdatedAt:          updatedAt,
	}
}
