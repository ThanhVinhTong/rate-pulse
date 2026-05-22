package service

import (
	"context"
	"database/sql"
	"errors"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/ThanhVinhTong/rate-pulse/worker"
	"github.com/google/uuid"
	"github.com/hibiken/asynq"
	"github.com/stretchr/testify/require"
)

type fakeTaskDistributor struct {
	called  bool
	payload *worker.PayloadSendVerifyEmail
	err     error
}

func (f *fakeTaskDistributor) DistributeTaskSendVerifyEmail(
	ctx context.Context,
	payload *worker.PayloadSendVerifyEmail,
	opts ...asynq.Option,
) error {
	f.called = true
	f.payload = payload
	return f.err
}

func newTestAuthService(t *testing.T) (*AuthService, sqlmock.Sqlmock, token.Maker, *fakeTaskDistributor) {
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
	taskDistributor := &fakeTaskDistributor{}

	return NewAuthService(config, store, tokenMaker, taskDistributor), mock, tokenMaker, taskDistributor
}

func requireServiceErrorCode(t *testing.T, err error, expectedCode string) {
	t.Helper()

	require.Error(t, err)
	require.True(t, IsServiceError(err))
	require.Equal(t, expectedCode, ServiceErrorCode(err))
}

func validCreateUserInput() CreateUserInput {
	return CreateUserInput{
		Username:           "testuser",
		Email:              "test@example.com",
		Password:           "StrongPass123!xyz",
		TimeZone:           "Australia/Perth",
		LanguagePreference: "en",
		CountryOfResidence: "AU",
		CountryOfBirth:     "VN",
		FirstName:          "Test",
		LastName:           "User",
	}
}

func newCreateUserRows(userID int32, now time.Time) *sqlmock.Rows {
	return newCreateUserRowsWithEmailVerified(userID, now, false)
}

func newCreateUserRowsWithEmailVerified(userID int32, now time.Time, emailVerified bool) *sqlmock.Rows {
	return sqlmock.NewRows([]string{
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
		"hashed-password",
		sql.NullString{String: "free", Valid: true},
		sql.NullBool{Bool: emailVerified, Valid: true},
		sql.NullString{String: "Australia/Perth", Valid: true},
		sql.NullString{String: "en", Valid: true},
		sql.NullString{String: "AU", Valid: true},
		sql.NullString{String: "VN", Valid: true},
		sql.NullBool{Bool: true, Valid: true},
		sql.NullTime{Time: now, Valid: true},
		sql.NullTime{Time: now, Valid: true},
		sql.NullString{String: "Test", Valid: true},
		sql.NullString{String: "User", Valid: true},
	)
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
			authService, mock, _, _ := newTestAuthService(t)

			user, err := authService.CreateUser(context.Background(), tt.input)

			requireServiceErrorCode(t, err, tt.expectedCode)
			require.Empty(t, user)
			require.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestAuthServiceCreateUserSuccess(t *testing.T) {
	authService, mock, _, taskDistributor := newTestAuthService(t)

	userID := int32(42)
	mock.ExpectBegin()
	mock.ExpectQuery("INSERT INTO users").
		WillReturnRows(newCreateUserRows(userID, time.Now()))
	mock.ExpectCommit()

	user, err := authService.CreateUser(context.Background(), validCreateUserInput())

	require.NoError(t, err)
	require.Equal(t, userID, user.UserID)
	require.True(t, taskDistributor.called)
	require.NotNil(t, taskDistributor.payload)
	require.Equal(t, userID, taskDistributor.payload.UserId)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestAuthServiceCreateUserRollbackWhenTaskDistributionFails(t *testing.T) {
	authService, mock, _, taskDistributor := newTestAuthService(t)
	taskDistributor.err = errors.New("redis unavailable")

	mock.ExpectBegin()
	mock.ExpectQuery("INSERT INTO users").
		WillReturnRows(newCreateUserRows(42, time.Now()))
	mock.ExpectRollback()

	user, err := authService.CreateUser(context.Background(), validCreateUserInput())

	requireServiceErrorCode(t, err, ErrInternal.Code)
	require.Empty(t, user)
	require.True(t, taskDistributor.called)
	require.NoError(t, mock.ExpectationsWereMet())
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
			authService, mock, _, _ := newTestAuthService(t)

			result, err := authService.SignIn(context.Background(), tt.input)

			requireServiceErrorCode(t, err, tt.expectedCode)
			require.Empty(t, result)
			require.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestAuthServiceSignInUserNotFound(t *testing.T) {
	authService, mock, _, _ := newTestAuthService(t)

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
	authService, mock, tokenMaker, _ := newTestAuthService(t)

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
	authService, mock, tokenMaker, _ := newTestAuthService(t)

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

func newVerifyEmailRows(emailID int64, userID int32, secretCodeHash string, isUsed bool, expiresAt time.Time) *sqlmock.Rows {
	now := time.Now()
	return sqlmock.NewRows([]string{
		"id",
		"user_id",
		"email",
		"secret_code_hash",
		"is_used",
		"created_at",
		"expired_at",
	}).AddRow(
		emailID,
		userID,
		"test@example.com",
		secretCodeHash,
		isUsed,
		now,
		expiresAt,
	)
}

func TestAuthServiceVerifyEmailValidation(t *testing.T) {
	tests := []struct {
		name  string
		input VerifyEmailInput
	}{
		{
			name: "missing email id",
			input: VerifyEmailInput{
				SecretCode: "secret",
			},
		},
		{
			name: "missing secret code",
			input: VerifyEmailInput{
				EmailID: 42,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			authService, mock, _, _ := newTestAuthService(t)

			result, err := authService.VerifyEmail(context.Background(), tt.input)

			requireServiceErrorCode(t, err, ErrInvalidInput.Code)
			require.Empty(t, result)
			require.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

func TestAuthServiceVerifyEmailSuccess(t *testing.T) {
	authService, mock, _, _ := newTestAuthService(t)

	const secretCode = "plain-secret-code"
	const emailID = int64(42)
	const userID = int32(7)
	secretCodeHash, err := util.HashPassword(secretCode)
	require.NoError(t, err)

	mock.ExpectQuery("SELECT (.+) FROM verify_emails").
		WithArgs(emailID).
		WillReturnRows(newVerifyEmailRows(emailID, userID, secretCodeHash, false, time.Now().Add(time.Minute)))
	mock.ExpectBegin()
	mock.ExpectQuery("UPDATE verify_emails").
		WithArgs(emailID, userID, secretCodeHash).
		WillReturnRows(newVerifyEmailRows(emailID, userID, secretCodeHash, true, time.Now().Add(time.Minute)))
	mock.ExpectQuery("UPDATE users").
		WithArgs(userID).
		WillReturnRows(newCreateUserRowsWithEmailVerified(userID, time.Now(), true))
	mock.ExpectCommit()

	result, err := authService.VerifyEmail(context.Background(), VerifyEmailInput{
		EmailID:    emailID,
		SecretCode: secretCode,
	})

	require.NoError(t, err)
	require.Equal(t, userID, result.User.UserID)
	require.True(t, result.User.EmailVerified)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestAuthServiceVerifyEmailRejectsWrongSecret(t *testing.T) {
	authService, mock, _, _ := newTestAuthService(t)

	const emailID = int64(42)
	const userID = int32(7)
	secretCodeHash, err := util.HashPassword("expected-secret")
	require.NoError(t, err)

	mock.ExpectQuery("SELECT (.+) FROM verify_emails").
		WithArgs(emailID).
		WillReturnRows(newVerifyEmailRows(emailID, userID, secretCodeHash, false, time.Now().Add(time.Minute)))

	result, err := authService.VerifyEmail(context.Background(), VerifyEmailInput{
		EmailID:    emailID,
		SecretCode: "wrong-secret",
	})

	requireServiceErrorCode(t, err, ErrInvalidInput.Code)
	require.Empty(t, result)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestAuthServiceSignInSuccess(t *testing.T) {
	authService, mock, _, _ := newTestAuthService(t)

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
