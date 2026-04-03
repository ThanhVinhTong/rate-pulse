package gapi

import (
	"context"
	"database/sql"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/pb"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/lib/pq"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (server *Server) CreateUser(ctx context.Context, req *pb.CreateUserRequest) (*pb.CreateUserResponse, error) {
	// Normalize the email address
	req.Email = util.NormalizeEmail(req.GetEmail())

	// Check if the password is weak or not
	err := util.ValidatePassword(req.GetPassword())
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Weak password: %s", err.Error())
	}

	// Hash the password before storing
	hashedPassword, err := util.HashPassword(req.Password)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to hash password: %s", err.Error())
	}

	arg := db.CreateUserParams{
		Username:           req.Username,
		Email:              req.Email,
		Password:           hashedPassword,
		UserType:           sql.NullString{String: "free", Valid: true},
		EmailVerified:      sql.NullBool{Bool: false, Valid: true},
		TimeZone:           sql.NullString{String: req.TimeZone, Valid: true},
		LanguagePreference: sql.NullString{String: req.LanguagePreference, Valid: true},
		CountryOfResidence: sql.NullString{String: req.CountryOfResidence, Valid: true},
		CountryOfBirth:     sql.NullString{String: req.CountryOfBirth, Valid: true},
		IsActive:           sql.NullBool{Bool: true, Valid: true},
		LastName:           sql.NullString{String: req.LastName, Valid: true},
		FirstName:          sql.NullString{String: req.FirstName, Valid: true},
	}

	user, err := server.store.CreateUser(ctx, arg)
	if err != nil {
		// handle unique violation error
		if pqErr, ok := err.(*pq.Error); ok {
			switch pqErr.Code.Name() {
			case "unique_violation":
				return nil, status.Errorf(codes.AlreadyExists, "Email already exists: %s", err.Error())
			}
		}
		return nil, status.Errorf(codes.Internal, "Failed to create user: %s", err.Error())
	}

	response := &pb.CreateUserResponse{
		User: convertUser(user),
	}
	return response, nil
}
