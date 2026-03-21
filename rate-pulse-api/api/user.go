package api

import (
	"database/sql"
	"net/http"
	"strings"
	"time"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

// normalizeEmail normalizes an email for consistent uniqueness checking.
// - Always lowercases and trims whitespace
// - Applies Gmail-specific rules (dots and +aliases are ignored)
// - For other providers, only does basic normalization
func normalizeEmail(email string) string {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return ""
	}

	parts := strings.SplitN(email, "@", 2)
	if len(parts) != 2 {
		return email
	}

	local, domain := parts[0], parts[1]

	switch domain {
	case "gmail.com", "googlemail.com":
		// Gmail ignores dots and everything after +
		local = strings.ReplaceAll(local, ".", "")
		if idx := strings.Index(local, "+"); idx != -1 {
			local = local[:idx]
		}
		return local + "@gmail.com"

	case "outlook.com", "hotmail.com", "live.com":
		// Outlook treats dots as significant, but supports +alias
		if idx := strings.Index(local, "+"); idx != -1 {
			local = local[:idx]
		}
		return local + "@" + domain

	default:
		// For Yahoo and all other providers, only trim + lowercase
		return email
	}
}

// createUserRequest represents the request body for creating a new user.
// It contains all the required and optional fields for user registration.
type createUserRequest struct {
	Username           string `json:"username" binding:"required"`
	Email              string `json:"email" binding:"required,email"`
	Password           string `json:"password" binding:"required"`
	TimeZone           string `json:"time_zone"`
	LanguagePreference string `json:"language_preference"`
	CountryOfResidence string `json:"country_of_residence"`
	CountryOfBirth     string `json:"country_of_birth"`
	FirstName          string `json:"first_name" binding:"required"`
	LastName           string `json:"last_name" binding:"required"`
}

// userResponse represents the response body for user data.
// It excludes sensitive fields like password.
type userResponse struct {
	UserID             int32     `json:"user_id"`
	Username           string    `json:"username"`
	Email              string    `json:"email"`
	UserType           string    `json:"user_type"`
	EmailVerified      bool      `json:"email_verified"`
	TimeZone           string    `json:"time_zone"`
	LanguagePreference string    `json:"language_preference"`
	CountryOfResidence string    `json:"country_of_residence"`
	CountryOfBirth     string    `json:"country_of_birth"`
	FirstName          string    `json:"first_name"`
	LastName           string    `json:"last_name"`
	IsActive           bool      `json:"is_active"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// logoutRequest represents the request body for logging out a user.
// It contains the refresh token of the user's session.
type logoutRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// newUserResponse creates a userResponse from a db.User, excluding sensitive data.
func newUserResponse(user db.User) userResponse {
	return userResponse{
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

// createUser handles the creation of a new user.
// It binds the JSON request body to createUserRequest, validates the input,
// and persists the user to the database.
//
// POST /users
//
// Request body: createUserRequest (JSON)
// Response: User object on success, error message on failure
// Status codes:
//   - 200 OK: User created successfully
//   - 400 Bad Request: Invalid request body or validation error
//   - 500 Internal Server Error: Database or server error
func (server *Server) createUser(ctx *gin.Context) {
	var req createUserRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Normalize the email address
	req.Email = normalizeEmail(req.Email)

	// Check if the password is weak or not
	if err := util.ValidatePassword(req.Password); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash the password before storing
	hashedPassword, err := util.HashPassword(req.Password)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	arg := db.CreateUserParams{
		Username:           req.Username,
		Email:              req.Email,
		Password:           hashedPassword,
		UserType:           sql.NullString{String: UserTypeFree, Valid: true},
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
				ctx.JSON(http.StatusForbidden, errorResponse(err))
				return
			}
		}
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, newUserResponse(user))
}

// getUserRequest represents the URI parameters for fetching a single user.
// The ID must be a positive integer.
type getUserRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

// getUser retrieves a single user by their ID.
// The user ID is extracted from the URI path parameter.
//
// GET /users/:id
//
// URI parameters:
//   - id: The unique identifier of the user (required, must be >= 1)
//
// Response: User object on success, error message on failure
// Status codes:
//   - 200 OK: User retrieved successfully
//   - 400 Bad Request: Invalid or missing user ID
//   - 500 Internal Server Error: Database or server error
func (server *Server) getUser(ctx *gin.Context) {
	var req getUserRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	user, err := server.store.GetUserByID(ctx, req.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, newUserResponse(user))
}

// listUserRequest represents the query parameters for listing users with pagination.
// PageID starts from 1 and PageSize must be between 5 and 10.
type listUserRequest struct {
	PageID   int32 `form:"page_id" binding:"required,min=1"`
	PageSize int32 `form:"page_size" binding:"required,min=5,max=10"`
}

// listUser retrieves a paginated list of users.
// Pagination is controlled via query parameters page_id and page_size.
//
// GET /users?page_id=1&page_size=10
//
// Query parameters:
//   - page_id: The page number to retrieve (required, must be >= 1)
//   - page_size: The number of users per page (required, must be between 5 and 10)
//
// Response: Array of User objects on success, error message on failure
// Status codes:
//   - 200 OK: Users retrieved successfully
//   - 400 Bad Request: Invalid or missing pagination parameters
//   - 500 Internal Server Error: Database or server error
func (server *Server) listUser(ctx *gin.Context) {
	var req listUserRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.ListUsersParams{
		Limit:  req.PageSize,
		Offset: (req.PageID - 1) * req.PageSize,
	}

	users, err := server.store.ListUsers(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	responses := make([]userResponse, len(users))
	for i, user := range users {
		responses[i] = newUserResponse(user)
	}

	ctx.JSON(http.StatusOK, responses)
}

// updateUserRequest represents the request body for updating a user.
// It contains all the optional fields for user updates.
type updateUserRequest struct {
	Username           *string `json:"username"`
	Email              *string `json:"email"`
	Password           *string `json:"password"`
	TimeZone           *string `json:"time_zone"`
	LanguagePreference *string `json:"language_preference"`
	CountryOfResidence *string `json:"country_of_residence"`
	CountryOfBirth     *string `json:"country_of_birth"`
	FirstName          *string `json:"first_name"`
	LastName           *string `json:"last_name"`
}

type updateUserURIRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

// adminUpdateUserRequest represents the request body for admin-only user updates.
// Admins can update all fields including user_type, email_verified, and is_active.
type adminUpdateUserRequest struct {
	Username           *string `json:"username"`
	Email              *string `json:"email"`
	Password           *string `json:"password"`
	UserType           *string `json:"user_type" binding:"omitempty,oneof=free premium enterprise admin"`
	EmailVerified      *bool   `json:"email_verified"`
	TimeZone           *string `json:"time_zone"`
	LanguagePreference *string `json:"language_preference"`
	CountryOfResidence *string `json:"country_of_residence"`
	CountryOfBirth     *string `json:"country_of_birth"`
	FirstName          *string `json:"first_name"`
	LastName           *string `json:"last_name"`
	IsActive           *bool   `json:"is_active"`
}

// updateUser handles the updating of an existing user.
// It binds the JSON request body to updateUserRequest, validates the input,
// and updates the user in the database.
//
// PUT /users/:id
// Request body: updateUserRequest (JSON)
// Response: User object on success, error message on failure
// Status codes:
//   - 200 OK: User updated successfully
//   - 400 Bad Request: Invalid request body or validation error
//   - 500 Internal Server Error: Database or server error
func (server *Server) updateUser(ctx *gin.Context) {
	var uriReq updateUserURIRequest
	if err := ctx.ShouldBindUri(&uriReq); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	var req updateUserRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Hash password if provided
	var hashedPassword *string
	if req.Password != nil {
		hashed, err := util.HashPassword(*req.Password)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, errorResponse(err))
			return
		}
		hashedPassword = &hashed
	}

	arg := db.UpdateUserParams{
		Username:           sql.NullString{String: util.Value(req.Username), Valid: req.Username != nil},
		Email:              sql.NullString{String: util.Value(req.Email), Valid: req.Email != nil},
		Password:           sql.NullString{String: util.Value(hashedPassword), Valid: hashedPassword != nil},
		TimeZone:           sql.NullString{String: util.Value(req.TimeZone), Valid: req.TimeZone != nil},
		LanguagePreference: sql.NullString{String: util.Value(req.LanguagePreference), Valid: req.LanguagePreference != nil},
		CountryOfResidence: sql.NullString{String: util.Value(req.CountryOfResidence), Valid: req.CountryOfResidence != nil},
		CountryOfBirth:     sql.NullString{String: util.Value(req.CountryOfBirth), Valid: req.CountryOfBirth != nil},
		FirstName:          sql.NullString{String: util.Value(req.FirstName), Valid: req.FirstName != nil},
		LastName:           sql.NullString{String: util.Value(req.LastName), Valid: req.LastName != nil},
		UserID:             uriReq.ID,
	}

	user, err := server.store.UpdateUser(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, newUserResponse(user))
}

// adminUpdateUser handles admin-only updates to an existing user.
// Admin users can update all fields including user_type, email_verified, and is_active.
// This function is protected by adminMiddleware, so authorization is already enforced at the routing level.
//
// PUT /admin/users/:id
// Request body: updateUserRequest (JSON)
// Response: User object on success, error message on failure
// Status codes:
//   - 200 OK: User updated successfully
//   - 400 Bad Request: Invalid request body or validation error
//   - 500 Internal Server Error: Database or server error
func (server *Server) adminUpdateUser(ctx *gin.Context) {
	var uriReq updateUserURIRequest
	if err := ctx.ShouldBindUri(&uriReq); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	var req adminUpdateUserRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Hash password if provided
	var hashedPassword *string
	if req.Password != nil {
		hashed, err := util.HashPassword(*req.Password)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, errorResponse(err))
			return
		}
		hashedPassword = &hashed
	}

	arg := db.UpdateUserParams{
		Username:           sql.NullString{String: util.Value(req.Username), Valid: req.Username != nil},
		Email:              sql.NullString{String: util.Value(req.Email), Valid: req.Email != nil},
		Password:           sql.NullString{String: util.Value(hashedPassword), Valid: hashedPassword != nil},
		UserType:           sql.NullString{String: util.Value(req.UserType), Valid: req.UserType != nil},
		EmailVerified:      sql.NullBool{Bool: util.Value(req.EmailVerified), Valid: req.EmailVerified != nil},
		TimeZone:           sql.NullString{String: util.Value(req.TimeZone), Valid: req.TimeZone != nil},
		LanguagePreference: sql.NullString{String: util.Value(req.LanguagePreference), Valid: req.LanguagePreference != nil},
		CountryOfResidence: sql.NullString{String: util.Value(req.CountryOfResidence), Valid: req.CountryOfResidence != nil},
		CountryOfBirth:     sql.NullString{String: util.Value(req.CountryOfBirth), Valid: req.CountryOfBirth != nil},
		FirstName:          sql.NullString{String: util.Value(req.FirstName), Valid: req.FirstName != nil},
		LastName:           sql.NullString{String: util.Value(req.LastName), Valid: req.LastName != nil},
		IsActive:           sql.NullBool{Bool: util.Value(req.IsActive), Valid: req.IsActive != nil},
		UserID:             uriReq.ID,
	}

	user, err := server.store.UpdateUser(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, newUserResponse(user))
}

// deleteUserRequest represents the URI parameters for deleting a single user.
// The ID must be a positive integer.
type deleteUserRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

// deleteUser deletes a single user by their ID.
// The user ID is extracted from the URI path parameter.
//
// DELETE /admin/users/:id
//
// URI parameters:
//   - id: The unique identifier of the user (required, must be >= 1)
//
// Response: Success message on success, error message on failure
// Status codes:
//   - 200 OK: User deleted successfully
//   - 400 Bad Request: Invalid or missing user ID
//   - 500 Internal Server Error: Database or server error
func (server *Server) deleteUser(ctx *gin.Context) {
	var req deleteUserRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	err := server.store.DeleteUserByID(ctx, req.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// Authentication
type loginUserRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type loginUserResponse struct {
	SessionID             uuid.UUID    `json:"session_id"`
	AccessToken           string       `json:"access_token"`
	AccessTokenExpiresAt  time.Time    `json:"access_token_expires_at"`
	RefreshToken          string       `json:"refresh_token"`
	RefreshTokenExpiresAt time.Time    `json:"refresh_token_expires_at"`
	User                  userResponse `json:"user"`
}

func (server *Server) loginUser(ctx *gin.Context) {
	var req loginUserRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	const invalidCredentialsMsg = "invalid email or password"

	/// Early validation to prevent hitting database on bad input
	if req.Email == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "email is required"})
		return
	}
	if len(req.Email) > 254 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "email is too long"})
		return
	}
	if req.Password == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "password is required"})
		return
	}

	// Normalize the email address
	req.Email = normalizeEmail(req.Email)

	user, err := server.store.GetUserByEmail(ctx, req.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": invalidCredentialsMsg})
			return
		}
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	if err := util.CheckPassword(req.Password, user.Password); err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": invalidCredentialsMsg})
		return
	}

	// Check if the user is email verified
	// TODO: Implement this check after finishing email verification

	// Check if the user is active
	if user.IsActive.Valid && !user.IsActive.Bool {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": invalidCredentialsMsg})
		return
	}

	accessToken, accessPayload, err := server.tokenMaker.CreateToken(
		user.UserID,
		user.Username,
		user.Email,
		user.UserType.String,
		server.config.AccessTokenDuration,
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	refreshToken, refreshPayload, err := server.tokenMaker.CreateToken(
		user.UserID,
		user.Username,
		user.Email,
		user.UserType.String,
		server.config.RefreshTokenDuration,
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	session, err := server.store.CreateSession(ctx, db.CreateSessionParams{
		SessionID:    refreshPayload.ID,
		UserID:       user.UserID,
		RefreshToken: refreshToken,
		UserAgent:    ctx.Request.UserAgent(),
		ClientIp:     ctx.ClientIP(),
		IsBlocked:    sql.NullBool{Bool: false, Valid: true},
		ExpiresAt:    refreshPayload.ExpiredAt,
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	res := loginUserResponse{
		SessionID:             session.SessionID,
		AccessToken:           accessToken,
		AccessTokenExpiresAt:  accessPayload.ExpiredAt,
		RefreshToken:          refreshToken,
		RefreshTokenExpiresAt: refreshPayload.ExpiredAt,
		User:                  newUserResponse(user),
	}
	ctx.JSON(http.StatusOK, res)
}

// logoutUser handles user sign out by revoking the current session.
// It expects a refresh token in the request body.
func (server *Server) logoutUser(ctx *gin.Context) {
	var req logoutRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// For now, we'll just return success.
	// Later you can add logic to mark the session as blocked using the refresh token.
	ctx.JSON(http.StatusOK, gin.H{
		"message": "Successfully signed out",
	})
}
