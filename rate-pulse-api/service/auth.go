package service

import (
	"context"
	"database/sql"
	"errors"
	"time"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/lib/pq"
)

type AuthService struct {
	config     util.Config
	store      *db.Store
	tokenMaker token.Maker
}

func NewAuthService(config util.Config, store *db.Store, tokenMaker token.Maker) *AuthService {
	return &AuthService{
		config:     config,
		store:      store,
		tokenMaker: tokenMaker,
	}
}

func (s *AuthService) CreateUser(ctx context.Context, input CreateUserInput) (AuthUser, error) {
	// Normalize the email address
	email := util.NormalizeEmail(input.Email)

	// Check if the password is weak or not
	if err := util.ValidatePassword(input.Password); err != nil {
		return AuthUser{}, Wrap(err, ErrInvalidInput.Code, "weak password")
	}

	// Hash the password before storing
	hashedPassword, err := util.HashPassword(input.Password)
	if err != nil {
		return AuthUser{}, Wrap(err, ErrInternal.Code, "failed to hash password")
	}

	user, err := s.store.CreateUser(ctx, db.CreateUserParams{
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
	})
	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code.Name() == "unique_violation" {
			return AuthUser{}, Wrap(err, ErrDuplicateEmail.Code, ErrDuplicateEmail.Message)
		}
		return AuthUser{}, Wrap(err, ErrInternal.Code, "failed to create user")
	}
	return newAuthUser(user), nil
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
		User:                  newAuthUser(user),
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

func newAuthUser(user db.User) AuthUser {
	return AuthUser{
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
