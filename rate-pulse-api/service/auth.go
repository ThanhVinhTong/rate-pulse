/*
auth service is responsible for handling all authentication related operations.
It provides methods for creating users, signing in users, renewing access tokens, and signing out users.
*/
package service

import (
	"context"
	"database/sql"
	"errors"
	"net/mail"
	"strings"
	"time"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/ThanhVinhTong/rate-pulse/worker"
	"github.com/hibiken/asynq"
	"github.com/lib/pq"
)

type AuthService struct {
	config          util.Config
	store           db.Store
	tokenMaker      token.Maker
	taskDistributor worker.TaskDistributor
}

func NewAuthService(config util.Config, store db.Store, tokenMaker token.Maker, taskDistributor worker.TaskDistributor) *AuthService {
	return &AuthService{
		config:          config,
		store:           store,
		tokenMaker:      tokenMaker,
		taskDistributor: taskDistributor,
	}
}

func (s *AuthService) CreateUser(ctx context.Context, input CreateUserInput) (User, error) {
	if strings.TrimSpace(input.Username) == "" {
		return User{}, Wrap(errors.New("username is required"), ErrInvalidInput.Code, "username is required")
	}
	if strings.TrimSpace(input.Email) == "" {
		return User{}, Wrap(errors.New("email is required"), ErrInvalidInput.Code, "email is required")
	}
	if len(input.Email) > 254 {
		return User{}, Wrap(errors.New("email is too long"), ErrInvalidInput.Code, "email is too long")
	}
	if parsed, err := mail.ParseAddress(input.Email); err != nil || parsed.Address != strings.TrimSpace(input.Email) {
		return User{}, Wrap(err, ErrInvalidInput.Code, "email is invalid")
	}
	if input.Password == "" {
		return User{}, Wrap(errors.New("password is required"), ErrInvalidInput.Code, "password is required")
	}
	if strings.TrimSpace(input.FirstName) == "" {
		return User{}, Wrap(errors.New("first_name is required"), ErrInvalidInput.Code, "first_name is required")
	}
	if strings.TrimSpace(input.LastName) == "" {
		return User{}, Wrap(errors.New("last_name is required"), ErrInvalidInput.Code, "last_name is required")
	}

	// Normalize the email address
	email := util.NormalizeEmail(input.Email)

	// Check if the password is weak or not
	if err := util.ValidatePassword(input.Password); err != nil {
		return User{}, Wrap(err, ErrInvalidInput.Code, "weak password")
	}

	// Hash the password before storing
	hashedPassword, err := util.HashPassword(input.Password)
	if err != nil {
		return User{}, Wrap(err, ErrInternal.Code, "failed to hash password")
	}

	arg := db.CreateUserTxParams{
		CreateUserParams: db.CreateUserParams{
			Username:           input.Username,
			Email:              email,
			Password:           hashedPassword,
			UserType:           sql.NullString{String: "free", Valid: true},
			EmailVerified:      sql.NullBool{Bool: false, Valid: true},
			TimeZone:           sql.NullString{String: input.TimeZone, Valid: true},
			LanguagePreference: sql.NullString{String: input.LanguagePreference, Valid: true},
			CountryOfResidence: sql.NullString{String: input.CountryOfResidence, Valid: true},
			CountryOfBirth:     sql.NullString{String: input.CountryOfBirth, Valid: true},
			IsActive:           sql.NullBool{Bool: true, Valid: true},
			LastName:           sql.NullString{String: input.LastName, Valid: true},
			FirstName:          sql.NullString{String: input.FirstName, Valid: true},
		},
		AfterCreate: func(user db.User) error {
			opts := []asynq.Option{
				asynq.MaxRetry(10),
				asynq.Timeout(30 * time.Second),
				asynq.Queue(worker.QueueCritical),
			}

			return s.taskDistributor.DistributeTaskSendVerifyEmail(
				ctx,
				&worker.PayloadSendVerifyEmail{UserId: user.UserID},
				opts...,
			)
		},
	}

	result, err := s.store.CreateUserTx(ctx, arg)
	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code.Name() == "unique_violation" {
			return User{}, Wrap(err, ErrDuplicateEmail.Code, ErrDuplicateEmail.Message)
		}
		return User{}, Wrap(err, ErrInternal.Code, "failed to create user")
	}

	return NewUser(result.User), nil
}

func (s *AuthService) SignIn(ctx context.Context, input SignInInput) (SignInResult, error) {
	// Early validation to prevent hitting database on bad input
	if input.Email == "" {
		return SignInResult{}, Wrap(errors.New("email is required"), ErrInvalidInput.Code, "email is required")
	}
	if len(input.Email) > 254 {
		return SignInResult{}, Wrap(errors.New("email is too long"), ErrInvalidInput.Code, "email is too long")
	}
	if input.Password == "" {
		return SignInResult{}, Wrap(errors.New("password is required"), ErrInvalidInput.Code, "password is required")
	}

	// Normalize the email address
	email := util.NormalizeEmail(input.Email)

	// check exists
	user, err := s.store.GetUserByEmail(ctx, email)
	if err != nil {
		if err == sql.ErrNoRows {
			return SignInResult{}, Wrap(err, ErrInvalidCredentials.Code, "invalid email or password")
		}
		return SignInResult{}, Wrap(err, ErrInternal.Code, "failed to get user by email")
	}

	// check password
	if err := util.CheckPassword(input.Password, user.Password); err != nil {
		return SignInResult{}, Wrap(err, ErrInvalidCredentials.Code, "invalid email or password")
	}

	// Check if the user is email verified
	// TODO: Implement this check after finishing email verification

	// Check if the user is active
	if user.IsActive.Valid && !user.IsActive.Bool {
		return SignInResult{}, Wrap(errors.New("user is inactive"), ErrInvalidCredentials.Code, "user is inactive")
	}

	accessToken, accessPayload, err := s.tokenMaker.CreateToken(
		user.UserID,
		user.Username,
		user.Email,
		user.UserType.String,
		s.config.AccessTokenDuration,
	)
	if err != nil {
		return SignInResult{}, Wrap(err, ErrInternal.Code, "failed to create access token")
	}

	refreshToken, refreshPayload, err := s.tokenMaker.CreateToken(
		user.UserID,
		user.Username,
		user.Email,
		user.UserType.String,
		s.config.RefreshTokenDuration,
	)
	if err != nil {
		return SignInResult{}, Wrap(err, ErrInternal.Code, "failed to create refresh token")
	}

	session, err := s.store.CreateSession(ctx, db.CreateSessionParams{
		SessionID:    refreshPayload.ID,
		UserID:       user.UserID,
		RefreshToken: refreshToken,
		UserAgent:    input.UserAgent,
		ClientIp:     input.ClientIP,
		IsBlocked:    sql.NullBool{Bool: false, Valid: true},
		ExpiresAt:    refreshPayload.ExpiredAt,
	})
	if err != nil {
		return SignInResult{}, Wrap(err, ErrInternal.Code, "failed to create session")
	}

	res := SignInResult{
		SessionID:             session.SessionID,
		AccessToken:           accessToken,
		AccessTokenExpiresAt:  accessPayload.ExpiredAt,
		RefreshToken:          refreshToken,
		RefreshTokenExpiresAt: refreshPayload.ExpiredAt,
		User:                  NewUser(user),
	}
	return res, nil
}

func (s *AuthService) RenewAccessToken(ctx context.Context, input RenewAccessTokenInput) (RenewAccessTokenResult, error) {
	if input.RefreshToken == "" {
		return RenewAccessTokenResult{}, Wrap(errors.New("refresh token is required"), ErrInvalidInput.Code, "refresh token is required")
	}

	refreshPayload, err := s.tokenMaker.VerifyToken(input.RefreshToken)
	if err != nil {
		return RenewAccessTokenResult{}, Wrap(err, ErrUnauthorized.Code, "invalid refresh token")
	}

	session, err := s.store.GetSessionByID(ctx, refreshPayload.ID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return RenewAccessTokenResult{}, Wrap(err, ErrSessionNotFound.Code, "session not found")
		}
		return RenewAccessTokenResult{}, Wrap(err, ErrInternal.Code, "failed to get session")
	}

	if session.IsBlocked.Valid && session.IsBlocked.Bool {
		return RenewAccessTokenResult{}, Wrap(errors.New("session is blocked"), ErrSessionBlocked.Code, "session is blocked")
	}

	if session.UserID != refreshPayload.UserID {
		return RenewAccessTokenResult{}, Wrap(errors.New("incorrect session user"), ErrUnauthorized.Code, "invalid session")
	}

	if session.RefreshToken != input.RefreshToken {
		return RenewAccessTokenResult{}, Wrap(errors.New("mismatched session token"), ErrUnauthorized.Code, "invalid session")
	}

	if time.Now().After(session.ExpiresAt) {
		return RenewAccessTokenResult{}, Wrap(errors.New("session expired"), ErrSessionExpired.Code, "session expired")
	}

	accessToken, accessPayload, err := s.tokenMaker.CreateToken(
		refreshPayload.UserID,
		refreshPayload.Username,
		refreshPayload.Email,
		refreshPayload.UserType,
		s.config.AccessTokenDuration,
	)
	if err != nil {
		return RenewAccessTokenResult{}, Wrap(err, ErrInternal.Code, "failed to create access token")
	}

	return RenewAccessTokenResult{
		AccessToken:          accessToken,
		AccessTokenExpiresAt: accessPayload.ExpiredAt,
	}, nil
}

func (s *AuthService) SignOut(ctx context.Context, refreshToken string) error {
	// TODO: Implement real signout after adding a query to block or revoke sessions.
	if refreshToken == "" {
		return Wrap(errors.New("refresh token is required"), ErrInvalidInput.Code, "refresh token is required")
	}
	return nil
}
