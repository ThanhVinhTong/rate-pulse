/*
user service is responsible for handling all user related operations.
It provides methods for getting users, listing users, and updating users.
*/
package service

import (
	"context"
	"database/sql"
	"errors"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/util"
)

type UserService struct {
	store db.Store
}

func NewUserService(store db.Store) *UserService {
	return &UserService{store: store}
}

/*
GetUser Service is responsible for getting a user by their ID.
- Validate user_id > 0
- Call store.GetUserByID
- Convert db.User to safe service user model
- Return ErrNotFound or ErrInternal
*/
func (s *UserService) GetUser(ctx context.Context, input GetUserInput) (User, error) {
	if input.UserID <= 0 {
		return User{}, Wrap(nil, ErrInvalidInput.Code, "user_id must be greater than 0")
	}

	user, err := s.store.GetUserByID(ctx, input.UserID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return User{}, Wrap(err, ErrNotFound.Code, "user not found")
		}
		return User{}, Wrap(err, ErrInternal.Code, "failed to get user by id")
	}

	return NewUser(user), nil
}

/*
ListUsers Service is responsible for listing users with pagination.
- Validate page_id >= 1
- Validate page_size range between 5 and 10
- Calculate offset = (page_id - 1) * page_size
- Call store.ListUsers
- Convert []db.User to []User
- Return ErrInvalidInput, ErrInternal, or ErrNotFound
*/
func (s *UserService) ListUsers(ctx context.Context, input ListUsersInput) ([]User, error) {
	if input.PageID <= 0 {
		return nil, Wrap(nil, ErrInvalidInput.Code, "page_id must be greater than 0")
	}
	if input.PageSize < 5 || input.PageSize > 10 {
		return nil, Wrap(nil, ErrInvalidInput.Code, "page_size must be between 5 and 10")
	}
	arg := db.ListUsersParams{
		Limit:  input.PageSize,
		Offset: (input.PageID - 1) * input.PageSize,
	}

	users, err := s.store.ListUsers(ctx, arg)
	if err != nil {
		return nil, Wrap(err, ErrInternal.Code, "failed to list users")
	}

	res := make([]User, len(users))
	for i, user := range users {
		res[i] = NewUser(user)
	}
	return res, nil
}

/*
UpdateUser Service is responsible for updating a user by their ID.
- Validate user_id > 0
- Hash password if provided
- Normalize email if provided
- Build db.UpdateUserParams
- Call store.UpdateUser
- Return safe user model
*/
func (s *UserService) UpdateUser(ctx context.Context, input UpdateUserInput) (User, error) {
	if input.UserID <= 0 {
		return User{}, Wrap(nil, ErrInvalidInput.Code, "user_id must be greater than 0")
	}

	var email *string
	if input.Email != nil {
		normalized := util.NormalizeEmail(*input.Email)
		email = &normalized
	}

	// Hash password if provided
	var hashedPassword *string
	if input.Password != nil {
		hashed, err := util.HashPassword(*input.Password)
		if err != nil {
			return User{}, Wrap(err, ErrInternal.Code, "failed to hash password")
		}
		hashedPassword = &hashed
	}

	user, err := s.store.UpdateUser(ctx, db.UpdateUserParams{
		Username:           sql.NullString{String: util.Value(input.Username), Valid: input.Username != nil},
		Email:              sql.NullString{String: util.Value(email), Valid: email != nil},
		Password:           sql.NullString{String: util.Value(hashedPassword), Valid: hashedPassword != nil},
		TimeZone:           sql.NullString{String: util.Value(input.TimeZone), Valid: input.TimeZone != nil},
		LanguagePreference: sql.NullString{String: util.Value(input.LanguagePreference), Valid: input.LanguagePreference != nil},
		CountryOfResidence: sql.NullString{String: util.Value(input.CountryOfResidence), Valid: input.CountryOfResidence != nil},
		CountryOfBirth:     sql.NullString{String: util.Value(input.CountryOfBirth), Valid: input.CountryOfBirth != nil},
		FirstName:          sql.NullString{String: util.Value(input.FirstName), Valid: input.FirstName != nil},
		LastName:           sql.NullString{String: util.Value(input.LastName), Valid: input.LastName != nil},
		UserID:             input.UserID,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return User{}, Wrap(err, ErrNotFound.Code, "user not found")
		}
		return User{}, Wrap(err, ErrInternal.Code, "failed to update user")
	}
	return NewUser(user), nil
}

/*
AdminUpdateUser Service is responsible for updating a user by their ID.
- Validate UserID > 0
- Hash password if provided
- Normalize email if provided
- Validate admin-only UserType if provided
- Build db.UpdateUserParams
- Allow UserType, EmailVerified, IsActive
*/
func (s *UserService) AdminUpdateUser(ctx context.Context, input AdminUpdateUserInput) (User, error) {
	if input.UserID <= 0 {
		return User{}, Wrap(nil, ErrInvalidInput.Code, "user_id must be greater than 0")
	}

	if input.UserType != nil {
		switch *input.UserType {
		case "free", "premium", "enterprise", "admin":
		default:
			return User{}, Wrap(nil, ErrInvalidInput.Code, "invalid user_type")
		}
	}

	var email *string
	if input.Email != nil {
		normalized := util.NormalizeEmail(*input.Email)
		email = &normalized
	}

	var hashedPassword *string
	if input.Password != nil {
		hashed, err := util.HashPassword(*input.Password)
		if err != nil {
			return User{}, Wrap(err, ErrInternal.Code, "failed to hash password")
		}
		hashedPassword = &hashed
	}

	user, err := s.store.UpdateUser(ctx, db.UpdateUserParams{
		Username:           sql.NullString{String: util.Value(input.Username), Valid: input.Username != nil},
		Email:              sql.NullString{String: util.Value(email), Valid: email != nil},
		Password:           sql.NullString{String: util.Value(hashedPassword), Valid: hashedPassword != nil},
		UserType:           sql.NullString{String: util.Value(input.UserType), Valid: input.UserType != nil},
		EmailVerified:      sql.NullBool{Bool: util.Value(input.EmailVerified), Valid: input.EmailVerified != nil},
		TimeZone:           sql.NullString{String: util.Value(input.TimeZone), Valid: input.TimeZone != nil},
		LanguagePreference: sql.NullString{String: util.Value(input.LanguagePreference), Valid: input.LanguagePreference != nil},
		CountryOfResidence: sql.NullString{String: util.Value(input.CountryOfResidence), Valid: input.CountryOfResidence != nil},
		CountryOfBirth:     sql.NullString{String: util.Value(input.CountryOfBirth), Valid: input.CountryOfBirth != nil},
		FirstName:          sql.NullString{String: util.Value(input.FirstName), Valid: input.FirstName != nil},
		LastName:           sql.NullString{String: util.Value(input.LastName), Valid: input.LastName != nil},
		IsActive:           sql.NullBool{Bool: util.Value(input.IsActive), Valid: input.IsActive != nil},
		UserID:             input.UserID,
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return User{}, Wrap(err, ErrNotFound.Code, "user not found")
		}
		return User{}, Wrap(err, ErrInternal.Code, "failed to update user")
	}

	return NewUser(user), nil
}

/*
DeleteUser Service is responsible for deleting a user by their ID.
- Validate user_id > 0
- Call store.DeleteUserByID
- Convert DB errors to service errors
*/
func (s *UserService) DeleteUser(ctx context.Context, input DeleteUserInput) error {
	if input.UserID <= 0 {
		return Wrap(nil, ErrInvalidInput.Code, "user_id must be greater than 0")
	}

	if err := s.store.DeleteUserByID(ctx, input.UserID); err != nil {
		return Wrap(err, ErrInternal.Code, "failed to delete user")
	}

	return nil
}
