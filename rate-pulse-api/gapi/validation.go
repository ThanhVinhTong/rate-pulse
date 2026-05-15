package gapi

import (
	"net/mail"
	"strings"

	"github.com/ThanhVinhTong/rate-pulse/pb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func validateCreateUserRequest(req *pb.CreateUserRequest) error {
	if strings.TrimSpace(req.GetUsername()) == "" {
		return status.Error(codes.InvalidArgument, "username is required")
	}
	if err := validateEmail(req.GetEmail()); err != nil {
		return err
	}
	if req.GetPassword() == "" {
		return status.Error(codes.InvalidArgument, "password is required")
	}
	if strings.TrimSpace(req.GetFirstName()) == "" {
		return status.Error(codes.InvalidArgument, "first_name is required")
	}
	if strings.TrimSpace(req.GetLastName()) == "" {
		return status.Error(codes.InvalidArgument, "last_name is required")
	}
	return nil
}

func validateSignInUserRequest(req *pb.SignInUserRequest) error {
	if err := validateEmail(req.GetEmail()); err != nil {
		return err
	}
	if req.GetPassword() == "" {
		return status.Error(codes.InvalidArgument, "password is required")
	}
	return nil
}

func validateRenewAccessTokenRequest(req *pb.RenewAccessTokenRequest) error {
	if strings.TrimSpace(req.GetRefreshToken()) == "" {
		return status.Error(codes.InvalidArgument, "refresh_token is required")
	}
	return nil
}

func validateGetLatestExchangeRatesRequest(req *pb.GetLatestExchangeRatesRequest) error {
	if req.GetSourceCurrencyId() <= 0 {
		return status.Error(codes.InvalidArgument, "source_currency_id must be greater than 0")
	}
	if req.GetLimit() <= 0 || req.GetLimit() > 10000 {
		return status.Error(codes.InvalidArgument, "limit must be between 1 and 10000")
	}
	return nil
}

func validateEmail(email string) error {
	trimmedEmail := strings.TrimSpace(email)
	if trimmedEmail == "" {
		return status.Error(codes.InvalidArgument, "email is required")
	}
	if len(trimmedEmail) > 254 {
		return status.Error(codes.InvalidArgument, "email is too long")
	}
	parsed, err := mail.ParseAddress(trimmedEmail)
	if err != nil || parsed.Address != trimmedEmail {
		return status.Error(codes.InvalidArgument, "email is invalid")
	}
	return nil
}
