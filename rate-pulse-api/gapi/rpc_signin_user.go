package gapi

import (
	"context"
	"database/sql"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	pb "github.com/ThanhVinhTong/rate-pulse/pb"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func (server *Server) SignInUser(
	ctx context.Context,
	req *pb.SignInUserRequest,
) (*pb.SignInUserResponse, error) {
	const invalidCredentialsMsg = "invalid email or password"

	/// Early validation to prevent hitting database on bad input
	if req.GetEmail() == "" {
		return nil, status.Errorf(codes.InvalidArgument, "email is required")
	}
	if len(req.GetEmail()) > 254 {
		return nil, status.Errorf(codes.InvalidArgument, "email is too long")
	}
	if req.GetPassword() == "" {
		return nil, status.Errorf(codes.InvalidArgument, "password is required")
	}

	// Normalize the email address
	req.Email = util.NormalizeEmail(req.GetEmail())

	user, err := server.store.GetUserByEmail(ctx, req.GetEmail())
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Errorf(codes.NotFound, "user not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to get user: %v", err)
	}

	if err := util.CheckPassword(req.Password, user.Password); err != nil {
		return nil, status.Errorf(codes.Unauthenticated, "invalid credentials")
	}

	// Check if the user is email verified
	// TODO: Implement this check after finishing email verification

	// Check if the user is active
	if user.IsActive.Valid && !user.IsActive.Bool {
		return nil, status.Errorf(codes.Unauthenticated, "invalid credentials")
	}

	accessToken, accessPayload, err := server.tokenMaker.CreateToken(
		user.UserID,
		user.Username,
		user.Email,
		user.UserType.String,
		server.config.AccessTokenDuration,
	)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create access token: %v", err)
	}

	refreshToken, refreshPayload, err := server.tokenMaker.CreateToken(
		user.UserID,
		user.Username,
		user.Email,
		user.UserType.String,
		server.config.RefreshTokenDuration,
	)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create refresh token: %v", err)
	}

	metadata := server.GetMetadata(ctx)
	session, err := server.store.CreateSession(ctx, db.CreateSessionParams{
		SessionID:    refreshPayload.ID,
		UserID:       user.UserID,
		RefreshToken: refreshToken,
		UserAgent:    metadata.UserAgent,
		ClientIp:     metadata.ClientIp,
		IsBlocked:    sql.NullBool{Bool: false, Valid: true},
		ExpiresAt:    refreshPayload.ExpiredAt,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create session: %v", err)
	}

	response := &pb.SignInUserResponse{
		User:                  convertUser(user),
		SessionId:             session.SessionID.String(),
		AccessToken:           accessToken,
		RefreshToken:          refreshToken,
		AccessTokenExpiresAt:  timestamppb.New(accessPayload.ExpiredAt),
		RefreshTokenExpiresAt: timestamppb.New(refreshPayload.ExpiredAt),
	}
	return response, nil
}
