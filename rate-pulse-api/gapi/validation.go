package gapi

import (
	"net/mail"
	"strings"

	"github.com/ThanhVinhTong/rate-pulse/pb"
	"google.golang.org/genproto/googleapis/rpc/errdetails"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type validationViolation struct {
	field  string
	reason string
}

func validateCreateUserRequest(req *pb.CreateUserRequest) error {
	var violations []validationViolation

	if strings.TrimSpace(req.GetUsername()) == "" {
		violations = append(violations, validationViolation{field: "username", reason: "username is required"})
	}
	if violation := validateEmail("email", req.GetEmail()); violation != nil {
		violations = append(violations, *violation)
	}
	if req.GetPassword() == "" {
		violations = append(violations, validationViolation{field: "password", reason: "password is required"})
	}
	if strings.TrimSpace(req.GetFirstName()) == "" {
		violations = append(violations, validationViolation{field: "first_name", reason: "first_name is required"})
	}
	if strings.TrimSpace(req.GetLastName()) == "" {
		violations = append(violations, validationViolation{field: "last_name", reason: "last_name is required"})
	}
	if len(violations) > 0 {
		return invalidArgumentError(violations...)
	}
	return nil
}

func validateSignInUserRequest(req *pb.SignInUserRequest) error {
	var violations []validationViolation

	if violation := validateEmail("email", req.GetEmail()); violation != nil {
		violations = append(violations, *violation)
	}
	if req.GetPassword() == "" {
		violations = append(violations, validationViolation{field: "password", reason: "password is required"})
	}
	if len(violations) > 0 {
		return invalidArgumentError(violations...)
	}
	return nil
}

func validateRenewAccessTokenRequest(req *pb.RenewAccessTokenRequest) error {
	if strings.TrimSpace(req.GetRefreshToken()) == "" {
		return invalidArgumentError(validationViolation{field: "refresh_token", reason: "refresh_token is required"})
	}
	return nil
}

func validateGetLatestExchangeRatesRequest(req *pb.GetLatestExchangeRatesRequest) error {
	var violations []validationViolation

	if req.GetSourceCurrencyId() <= 0 {
		violations = append(violations, validationViolation{field: "source_currency_id", reason: "source_currency_id must be greater than 0"})
	}
	if req.GetLimit() <= 0 || req.GetLimit() > 10000 {
		violations = append(violations, validationViolation{field: "limit", reason: "limit must be between 1 and 10000"})
	}
	if len(violations) > 0 {
		return invalidArgumentError(violations...)
	}
	return nil
}

func validateEmail(field string, email string) *validationViolation {
	trimmedEmail := strings.TrimSpace(email)
	if trimmedEmail == "" {
		return &validationViolation{field: field, reason: field + " is required"}
	}
	if len(trimmedEmail) > 254 {
		return &validationViolation{field: field, reason: field + " is too long"}
	}
	parsed, err := mail.ParseAddress(trimmedEmail)
	if err != nil || parsed.Address != trimmedEmail {
		return &validationViolation{field: field, reason: field + " is invalid"}
	}
	return nil
}

func invalidArgumentError(violations ...validationViolation) error {
	fieldViolations := make([]*errdetails.BadRequest_FieldViolation, 0, len(violations))
	for _, violation := range violations {
		fieldViolations = append(fieldViolations, &errdetails.BadRequest_FieldViolation{
			Field:       violation.field,
			Description: violation.reason,
		})
	}

	st := status.New(codes.InvalidArgument, "invalid request parameters")
	st, err := st.WithDetails(&errdetails.BadRequest{
		FieldViolations: fieldViolations,
	})
	if err != nil {
		return status.Error(codes.InvalidArgument, "invalid request parameters")
	}
	return st.Err()
}
