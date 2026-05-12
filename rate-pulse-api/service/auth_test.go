package service

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
)

func newTestAuthService(t *testing.T) (*AuthService, sqlmock.Sqlmock, token.Maker) {
	t.Helper()

	sqlDB, mock, err := sqlmock.New()
	require.NoError(t, err)

	t.Cleanup(func() {
		_ = sqlDB.Close()
	})

	config := util.Config{
		TokenSymmetricKey:    util.RandomString(32),
		AccessTokenDuration:  time.Minute,
		RefreshTokenDuration: time.Hour,
	}

	tokenMaker, err := token.NewPasetoMaker(config.TokenSymmetricKey)
	require.NoError(t, err)

	store := db.NewStore(sqlDB)

	return NewAuthService(config, store, tokenMaker), mock, tokenMaker
}

func requireServiceErrorCode(t *testing.T, err error, expectedCode string) {
	t.Helper()

	require.Error(t, err)
	require.True(t, IsServiceError(err))
	require.Equal(t, expectedCode, ServiceErrorCode(err))
}

func TestAuthServiceCreateUserValidation(t *testing.T) {
	tests := []struct {
		name         string
		input        CreateUserInput
		expectedCode string
	}{
		{
			name: "weak password",
			input: CreateUserInput{
				Username: "testuser",
				Email:    "test@example.com",
				Password: "123",
			},
			expectedCode: ErrInvalidInput.Code,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			authService, mock, _ := newTestAuthService(t)

			user, err := authService.CreateUser(context.Background(), tt.input)

			requireServiceErrorCode(t, err, tt.expectedCode)
			require.Empty(t, user)
			require.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestAuthServiceSignInValidation(t *testing.T) {
	tests := []struct {
		name         string
		input        SignInInput
		expectedCode string
	}{
		{
			name: "missing email",
			input: SignInInput{
				Password: "correct horse battery staple",
			},
			expectedCode: ErrInvalidInput.Code,
		},
		{
			name: "missing password",
			input: SignInInput{
				Email: "test@example.com",
			},
			expectedCode: ErrInvalidInput.Code,
		},
		{
			name: "email too long",
			input: SignInInput{
				Email:    util.RandomString(255) + "@example.com",
				Password: "correct horse battery staple",
			},
			expectedCode: ErrInvalidInput.Code,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			authService, mock, _ := newTestAuthService(t)

			result, err := authService.SignIn(context.Background(), tt.input)

			requireServiceErrorCode(t, err, tt.expectedCode)
			require.Empty(t, result)
			require.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestAuthServiceSignInUserNotFound(t *testing.T) {
	authService, mock, _ := newTestAuthService(t)

	mock.ExpectQuery("SELECT user_id, username, email, password").
		WithArgs("missing@example.com").
		WillReturnError(sql.ErrNoRows)

	result, err := authService.SignIn(context.Background(), SignInInput{
		Email:    "missing@example.com",
		Password: "correct horse battery staple",
	})

	requireServiceErrorCode(t, err, ErrInvalidCredentials.Code)
	require.Empty(t, result)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestAuthServiceRenewAccessTokenSessionNotFound(t *testing.T) {
	authService, mock, tokenMaker := newTestAuthService(t)

	refreshToken, refreshPayload, err := tokenMaker.CreateToken(
		42,
		"testuser",
		"test@example.com",
		"free",
		time.Hour,
	)
	require.NoError(t, err)

	mock.ExpectQuery("SELECT session_id, user_id, refresh_token").
		WithArgs(refreshPayload.ID).
		WillReturnError(sql.ErrNoRows)

	result, err := authService.RenewAccessToken(context.Background(), RenewAccessTokenInput{
		RefreshToken: refreshToken,
	})

	requireServiceErrorCode(t, err, ErrSessionNotFound.Code)
	require.Empty(t, result)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestAuthServiceRenewAccessTokenSuccess(t *testing.T) {
	authService, mock, tokenMaker := newTestAuthService(t)

	refreshToken, refreshPayload, err := tokenMaker.CreateToken(
		42,
		"testuser",
		"test@example.com",
		"free",
		time.Hour,
	)
	require.NoError(t, err)

	mock.ExpectQuery("SELECT session_id, user_id, refresh_token").
		WithArgs(refreshPayload.ID).
		WillReturnRows(sqlmock.NewRows([]string{
			"session_id",
			"user_id",
			"refresh_token",
			"user_agent",
			"client_ip",
			"is_blocked",
			"expires_at",
			"created_at",
			"updated_at",
		}).AddRow(
			refreshPayload.ID,
			refreshPayload.UserID,
			refreshToken,
			"test-agent",
			"127.0.0.1",
			sql.NullBool{Bool: false, Valid: true},
			refreshPayload.ExpiredAt,
			sql.NullTime{Time: time.Now(), Valid: true},
			sql.NullTime{Time: time.Now(), Valid: true},
		))

	result, err := authService.RenewAccessToken(context.Background(), RenewAccessTokenInput{
		RefreshToken: refreshToken,
	})

	require.NoError(t, err)
	require.NotEmpty(t, result.AccessToken)
	require.True(t, result.AccessTokenExpiresAt.After(time.Now()))
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestAuthServiceSignInSuccess(t *testing.T) {
	authService, mock, _ := newTestAuthService(t)

	const password = "correct horse battery staple"

	hashedPassword, err := util.HashPassword(password)
	require.NoError(t, err)

	userID := int32(42)
	sessionID := uuid.New()
	now := time.Now()

	mock.ExpectQuery("SELECT user_id, username, email, password").
		WithArgs("test@example.com").
		WillReturnRows(sqlmock.NewRows([]string{
			"user_id",
			"username",
			"email",
			"password",
			"user_type",
			"email_verified",
			"time_zone",
			"language_preference",
			"country_of_residence",
			"country_of_birth",
			"is_active",
			"created_at",
			"updated_at",
			"first_name",
			"last_name",
		}).AddRow(
			userID,
			"testuser",
			"test@example.com",
			hashedPassword,
			sql.NullString{String: "free", Valid: true},
			sql.NullBool{Bool: false, Valid: true},
			sql.NullString{String: "UTC", Valid: true},
			sql.NullString{String: "en", Valid: true},
			sql.NullString{String: "AU", Valid: true},
			sql.NullString{String: "VN", Valid: true},
			sql.NullBool{Bool: true, Valid: true},
			sql.NullTime{Time: now, Valid: true},
			sql.NullTime{Time: now, Valid: true},
			sql.NullString{String: "Test", Valid: true},
			sql.NullString{String: "User", Valid: true},
		))

	mock.ExpectQuery("INSERT INTO sessions").
		WithArgs(
			sqlmock.AnyArg(),
			userID,
			sqlmock.AnyArg(),
			"test-agent",
			"127.0.0.1",
			sql.NullBool{Bool: false, Valid: true},
			sqlmock.AnyArg(),
		).
		WillReturnRows(sqlmock.NewRows([]string{
			"session_id",
			"user_id",
			"refresh_token",
			"user_agent",
			"client_ip",
			"is_blocked",
			"expires_at",
			"created_at",
			"updated_at",
		}).AddRow(
			sessionID,
			userID,
			"refresh-token",
			"test-agent",
			"127.0.0.1",
			sql.NullBool{Bool: false, Valid: true},
			time.Now().Add(time.Hour),
			sql.NullTime{Time: now, Valid: true},
			sql.NullTime{Time: now, Valid: true},
		))

	result, err := authService.SignIn(context.Background(), SignInInput{
		Email:     "test@example.com",
		Password:  password,
		UserAgent: "test-agent",
		ClientIP:  "127.0.0.1",
	})

	require.NoError(t, err)
	require.NotEmpty(t, result.AccessToken)
	require.NotEmpty(t, result.RefreshToken)
	require.Equal(t, userID, result.User.UserID)
	require.Equal(t, "test@example.com", result.User.Email)
	require.NoError(t, mock.ExpectationsWereMet())
}
