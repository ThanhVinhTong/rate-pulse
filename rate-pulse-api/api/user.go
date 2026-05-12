package api

import (
	"net/http"
	"time"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

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

// mapper from User to userResponse
func newUserResponseFromServiceUser(user service.User) userResponse {
	return userResponse{
		UserID:             user.UserID,
		Username:           user.Username,
		Email:              user.Email,
		UserType:           user.UserType,
		EmailVerified:      user.EmailVerified,
		TimeZone:           user.TimeZone,
		LanguagePreference: user.LanguagePreference,
		CountryOfResidence: user.CountryOfResidence,
		CountryOfBirth:     user.CountryOfBirth,
		FirstName:          user.FirstName,
		LastName:           user.LastName,
		IsActive:           user.IsActive,
		CreatedAt:          user.CreatedAt,
		UpdatedAt:          user.UpdatedAt,
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

	user, err := server.services.Auth.CreateUser(ctx, service.CreateUserInput{
		Username:           req.Username,
		Email:              req.Email,
		Password:           req.Password,
		TimeZone:           req.TimeZone,
		LanguagePreference: req.LanguagePreference,
		CountryOfResidence: req.CountryOfResidence,
		CountryOfBirth:     req.CountryOfBirth,
		FirstName:          req.FirstName,
		LastName:           req.LastName,
	})
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, newUserResponseFromServiceUser(user))
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

	user, err := server.services.Users.GetUser(ctx, service.GetUserInput{
		UserID: req.ID,
	})
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, newUserResponseFromServiceUser(user))
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

	users, err := server.services.Users.ListUsers(ctx, service.ListUsersInput{
		PageID:   req.PageID,
		PageSize: req.PageSize,
	})
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	responses := make([]userResponse, len(users))
	for i, user := range users {
		responses[i] = newUserResponseFromServiceUser(user)
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

	user, err := server.services.Users.UpdateUser(ctx, service.UpdateUserInput{
		UserID:             uriReq.ID,
		Username:           req.Username,
		Email:              req.Email,
		Password:           req.Password,
		TimeZone:           req.TimeZone,
		LanguagePreference: req.LanguagePreference,
		CountryOfResidence: req.CountryOfResidence,
		CountryOfBirth:     req.CountryOfBirth,
		FirstName:          req.FirstName,
		LastName:           req.LastName,
	})
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, newUserResponseFromServiceUser(user))
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

	user, err := server.services.Users.AdminUpdateUser(ctx, service.AdminUpdateUserInput{
		UserID:             uriReq.ID,
		Username:           req.Username,
		Email:              req.Email,
		Password:           req.Password,
		UserType:           req.UserType,
		EmailVerified:      req.EmailVerified,
		TimeZone:           req.TimeZone,
		LanguagePreference: req.LanguagePreference,
		CountryOfResidence: req.CountryOfResidence,
		CountryOfBirth:     req.CountryOfBirth,
		FirstName:          req.FirstName,
		LastName:           req.LastName,
		IsActive:           req.IsActive,
	})
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, newUserResponseFromServiceUser(user))
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

	err := server.services.Users.DeleteUser(ctx, service.DeleteUserInput{
		UserID: req.ID,
	})
	if err != nil {
		RespondServiceError(ctx, err)
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

	args, err := server.services.Auth.SignIn(ctx, service.SignInInput{
		Email:     req.Email,
		Password:  req.Password,
		UserAgent: ctx.Request.UserAgent(),
		ClientIP:  ctx.ClientIP(),
	})
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	res := loginUserResponse{
		SessionID:             args.SessionID,
		AccessToken:           args.AccessToken,
		AccessTokenExpiresAt:  args.AccessTokenExpiresAt,
		RefreshToken:          args.RefreshToken,
		RefreshTokenExpiresAt: args.RefreshTokenExpiresAt,
		User:                  newUserResponseFromServiceUser(args.User),
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

	err := server.services.Auth.SignOut(ctx, req.RefreshToken)
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Successfully signed out"})
}
