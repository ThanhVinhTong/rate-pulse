package service

import (
	"context"
	"database/sql"
	"errors"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/stretchr/testify/require"
)

func newTestUserService(t *testing.T) (*UserService, sqlmock.Sqlmock) {
	t.Helper()

	sqlDB, mock, err := sqlmock.New()
	require.NoError(t, err)

	t.Cleanup(func() {
		_ = sqlDB.Close()
	})

	return NewUserService(db.NewStore(sqlDB)), mock
}

func requireUserServiceErrorCode(t *testing.T, err error, code string) {
	t.Helper()

	require.Error(t, err)
	require.True(t, IsServiceError(err), "expected service error, got %T: %v", err, err)
	require.Equal(t, code, ServiceErrorCode(err))
}

func testDBUserForUserService() db.User {
	now := time.Now()

	return db.User{
		UserID:             42,
		Username:           "testuser",
		Email:              "test@example.com",
		Password:           "hashed-password",
		UserType:           sql.NullString{String: "free", Valid: true},
		EmailVerified:      sql.NullBool{Bool: false, Valid: true},
		TimeZone:           sql.NullString{String: "UTC", Valid: true},
		LanguagePreference: sql.NullString{String: "en", Valid: true},
		CountryOfResidence: sql.NullString{String: "AU", Valid: true},
		CountryOfBirth:     sql.NullString{String: "VN", Valid: true},
		IsActive:           sql.NullBool{Bool: true, Valid: true},
		CreatedAt:          sql.NullTime{Time: now, Valid: true},
		UpdatedAt:          sql.NullTime{Time: now, Valid: true},
		FirstName:          sql.NullString{String: "Test", Valid: true},
		LastName:           sql.NullString{String: "User", Valid: true},
	}
}

func userRows(users ...db.User) *sqlmock.Rows {
	rows := sqlmock.NewRows([]string{
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
	})

	for _, user := range users {
		rows.AddRow(
			user.UserID,
			user.Username,
			user.Email,
			user.Password,
			user.UserType,
			user.EmailVerified,
			user.TimeZone,
			user.LanguagePreference,
			user.CountryOfResidence,
			user.CountryOfBirth,
			user.IsActive,
			user.CreatedAt,
			user.UpdatedAt,
			user.FirstName,
			user.LastName,
		)
	}

	return rows
}

func TestUserServiceGetUserInvalidID(t *testing.T) {
	userService, mock := newTestUserService(t)

	user, err := userService.GetUser(context.Background(), GetUserInput{UserID: 0})

	requireUserServiceErrorCode(t, err, ErrInvalidInput.Code)
	require.Empty(t, user)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestUserServiceGetUserNotFound(t *testing.T) {
	userService, mock := newTestUserService(t)

	mock.ExpectQuery("SELECT user_id, username, email, password").
		WithArgs(int32(404)).
		WillReturnError(sql.ErrNoRows)

	user, err := userService.GetUser(context.Background(), GetUserInput{UserID: 404})

	requireUserServiceErrorCode(t, err, ErrNotFound.Code)
	require.Empty(t, user)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestUserServiceGetUserSuccess(t *testing.T) {
	userService, mock := newTestUserService(t)
	dbUser := testDBUserForUserService()

	mock.ExpectQuery("SELECT user_id, username, email, password").
		WithArgs(dbUser.UserID).
		WillReturnRows(userRows(dbUser))

	user, err := userService.GetUser(context.Background(), GetUserInput{UserID: dbUser.UserID})

	require.NoError(t, err)
	require.Equal(t, dbUser.UserID, user.UserID)
	require.Equal(t, dbUser.Email, user.Email)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestUserServiceListUsersInvalidPageID(t *testing.T) {
	userService, mock := newTestUserService(t)

	users, err := userService.ListUsers(context.Background(), ListUsersInput{
		PageID:   0,
		PageSize: 5,
	})

	requireUserServiceErrorCode(t, err, ErrInvalidInput.Code)
	require.Nil(t, users)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestUserServiceListUsersInvalidPageSize(t *testing.T) {
	userService, mock := newTestUserService(t)

	users, err := userService.ListUsers(context.Background(), ListUsersInput{
		PageID:   1,
		PageSize: 11,
	})

	requireUserServiceErrorCode(t, err, ErrInvalidInput.Code)
	require.Nil(t, users)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestUserServiceListUsersSuccess(t *testing.T) {
	userService, mock := newTestUserService(t)
	user1 := testDBUserForUserService()
	user2 := testDBUserForUserService()
	user2.UserID = 43
	user2.Email = "second@example.com"

	mock.ExpectQuery("SELECT user_id, username, email, password").
		WithArgs(int32(5), int32(0)).
		WillReturnRows(userRows(user1, user2))

	users, err := userService.ListUsers(context.Background(), ListUsersInput{
		PageID:   1,
		PageSize: 5,
	})

	require.NoError(t, err)
	require.Len(t, users, 2)
	require.Equal(t, user1.UserID, users[0].UserID)
	require.Equal(t, user2.UserID, users[1].UserID)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestUserServiceUpdateUserInvalidID(t *testing.T) {
	userService, mock := newTestUserService(t)

	user, err := userService.UpdateUser(context.Background(), UpdateUserInput{UserID: 0})

	requireUserServiceErrorCode(t, err, ErrInvalidInput.Code)
	require.Empty(t, user)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestUserServiceUpdateUserNotFound(t *testing.T) {
	userService, mock := newTestUserService(t)

	firstName := "Updated"

	mock.ExpectQuery("UPDATE users").
		WithArgs(
			sql.NullString{},
			sql.NullString{},
			sql.NullString{},
			sql.NullString{},
			sql.NullBool{},
			sql.NullString{},
			sql.NullString{},
			sql.NullString{},
			sql.NullString{},
			sql.NullBool{},
			sql.NullString{String: firstName, Valid: true},
			sql.NullString{},
			int32(42),
		).
		WillReturnError(sql.ErrNoRows)

	user, err := userService.UpdateUser(context.Background(), UpdateUserInput{
		UserID:    42,
		FirstName: &firstName,
	})

	requireUserServiceErrorCode(t, err, ErrNotFound.Code)
	require.Empty(t, user)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestUserServiceUpdateUserSuccess(t *testing.T) {
	userService, mock := newTestUserService(t)

	email := "  TEST@EXAMPLE.COM "
	firstName := "Updated"
	updatedUser := testDBUserForUserService()
	updatedUser.Email = "test@example.com"
	updatedUser.FirstName = sql.NullString{String: firstName, Valid: true}

	mock.ExpectQuery("UPDATE users").
		WithArgs(
			sql.NullString{},
			sql.NullString{String: "test@example.com", Valid: true},
			sql.NullString{},
			sql.NullString{},
			sql.NullBool{},
			sql.NullString{},
			sql.NullString{},
			sql.NullString{},
			sql.NullString{},
			sql.NullBool{},
			sql.NullString{String: firstName, Valid: true},
			sql.NullString{},
			int32(42),
		).
		WillReturnRows(userRows(updatedUser))

	user, err := userService.UpdateUser(context.Background(), UpdateUserInput{
		UserID:    42,
		Email:     &email,
		FirstName: &firstName,
	})

	require.NoError(t, err)
	require.Equal(t, updatedUser.Email, user.Email)
	require.Equal(t, firstName, user.FirstName)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestUserServiceAdminUpdateUserInvalidUserType(t *testing.T) {
	userService, mock := newTestUserService(t)

	userType := "owner"

	user, err := userService.AdminUpdateUser(context.Background(), AdminUpdateUserInput{
		UserID:   42,
		UserType: &userType,
	})

	requireUserServiceErrorCode(t, err, ErrInvalidInput.Code)
	require.Empty(t, user)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestUserServiceAdminUpdateUserSuccess(t *testing.T) {
	userService, mock := newTestUserService(t)

	userType := "admin"
	isActive := true
	updatedUser := testDBUserForUserService()
	updatedUser.UserType = sql.NullString{String: userType, Valid: true}
	updatedUser.IsActive = sql.NullBool{Bool: isActive, Valid: true}

	mock.ExpectQuery("UPDATE users").
		WithArgs(
			sql.NullString{},
			sql.NullString{},
			sql.NullString{},
			sql.NullString{String: userType, Valid: true},
			sql.NullBool{},
			sql.NullString{},
			sql.NullString{},
			sql.NullString{},
			sql.NullString{},
			sql.NullBool{Bool: isActive, Valid: true},
			sql.NullString{},
			sql.NullString{},
			int32(42),
		).
		WillReturnRows(userRows(updatedUser))

	user, err := userService.AdminUpdateUser(context.Background(), AdminUpdateUserInput{
		UserID:   42,
		UserType: &userType,
		IsActive: &isActive,
	})

	require.NoError(t, err)
	require.Equal(t, userType, user.UserType)
	require.True(t, user.IsActive)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestUserServiceDeleteUserInvalidID(t *testing.T) {
	userService, mock := newTestUserService(t)

	err := userService.DeleteUser(context.Background(), DeleteUserInput{UserID: 0})

	requireUserServiceErrorCode(t, err, ErrInvalidInput.Code)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestUserServiceDeleteUserDBError(t *testing.T) {
	userService, mock := newTestUserService(t)

	mock.ExpectExec("DELETE FROM users").
		WithArgs(int32(42)).
		WillReturnError(errors.New("database unavailable"))

	err := userService.DeleteUser(context.Background(), DeleteUserInput{UserID: 42})

	requireUserServiceErrorCode(t, err, ErrInternal.Code)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestUserServiceDeleteUserSuccess(t *testing.T) {
	userService, mock := newTestUserService(t)

	mock.ExpectExec("DELETE FROM users").
		WithArgs(int32(42)).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := userService.DeleteUser(context.Background(), DeleteUserInput{UserID: 42})

	require.NoError(t, err)
	require.NoError(t, mock.ExpectationsWereMet())
}
