package gapi

import (
	pb "github.com/ThanhVinhTong/rate-pulse/pb"
	"github.com/ThanhVinhTong/rate-pulse/service"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func convertLatestExchangeRate(exchangeRate service.LatestExchangeRate) *pb.LatestExchangeRate {
	validFromDate := timestamppb.New(exchangeRate.ValidFromDate)

	return &pb.LatestExchangeRate{
		RateId:                  exchangeRate.RateID,
		RateValue:               exchangeRate.RateValue,
		SourceCurrencyCode:      exchangeRate.SourceCurrencyCode,
		DestinationCurrencyCode: exchangeRate.DestinationCurrencyCode,
		ValidFromDate:           validFromDate,
		RateSourceCode:          exchangeRate.RateSourceCode,
		TypeName:                exchangeRate.TypeName,
		UpdatedAt:               timestamppb.New(exchangeRate.UpdatedAt),
	}
}

func convertUser(user service.User) *pb.User {
	return &pb.User{
		UserId:             user.UserID,
		Username:           user.Username,
		Email:              user.Email,
		UserType:           user.UserType,
		EmailVerified:      user.EmailVerified,
		TimeZone:           user.TimeZone,
		LanguagePreference: user.LanguagePreference,
		CountryOfResidence: user.CountryOfResidence,
		CountryOfBirth:     user.CountryOfBirth,
		IsActive:           user.IsActive,
		FirstName:          user.FirstName,
		LastName:           user.LastName,
		CreatedAt:          timestamppb.New(user.CreatedAt),
		UpdatedAt:          timestamppb.New(user.UpdatedAt),
	}
}
