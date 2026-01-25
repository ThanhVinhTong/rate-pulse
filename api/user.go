package api

import (
	"database/sql"
	"net/http"
	"time"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

// createUserRequest represents the request body for creating a new user.
// It contains all the required and optional fields for user registration.
type createUserRequest struct {
	Username           string `json:"username" binding:"required"`
	Email              string `json:"email" binding:"required,email"`
	Password           string `json:"password" binding:"required"`
	UserType           string `json:"user_type" binding:"required,oneof=free premium enterprise admin"`
	EmailVerified      bool   `json:"email_verified" binding:"boolean"`
	TimeZone           string `json:"time_zone"`
	LanguagePreference string `json:"language_preference"`
	CountryOfResidence string `json:"country_of_residence"`
	CountryOfBirth     string `json:"country_of_birth"`
	IsActive           bool   `json:"is_active" binding:"required,boolean"`
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
	IsActive           bool      `json:"is_active"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
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
		UserType:           sql.NullString{String: req.UserType, Valid: true},
		EmailVerified:      sql.NullBool{Bool: req.EmailVerified, Valid: true},
		TimeZone:           sql.NullString{String: req.TimeZone, Valid: true},
		LanguagePreference: sql.NullString{String: req.LanguagePreference, Valid: true},
		CountryOfResidence: sql.NullString{String: req.CountryOfResidence, Valid: true},
		CountryOfBirth:     sql.NullString{String: req.CountryOfBirth, Valid: true},
		IsActive:           sql.NullBool{Bool: req.IsActive, Valid: true},
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
	UserType           *string `json:"user_type" binding:"omitempty,oneof=free premium enterprise admin"`
	EmailVerified      *bool   `json:"email_verified"`
	TimeZone           *string `json:"time_zone"`
	LanguagePreference *string `json:"language_preference"`
	CountryOfResidence *string `json:"country_of_residence"`
	CountryOfBirth     *string `json:"country_of_birth"`
	IsActive           *bool   `json:"is_active"`
}

type updateUserURIRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
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
		Username:           sql.NullString{String: util.StrValue(req.Username), Valid: req.Username != nil},
		Email:              sql.NullString{String: util.StrValue(req.Email), Valid: req.Email != nil},
		Password:           sql.NullString{String: util.StrValue(hashedPassword), Valid: hashedPassword != nil},
		UserType:           sql.NullString{String: util.StrValue(req.UserType), Valid: req.UserType != nil},
		EmailVerified:      sql.NullBool{Bool: util.BoolValue(req.EmailVerified), Valid: req.EmailVerified != nil},
		TimeZone:           sql.NullString{String: util.StrValue(req.TimeZone), Valid: req.TimeZone != nil},
		LanguagePreference: sql.NullString{String: util.StrValue(req.LanguagePreference), Valid: req.LanguagePreference != nil},
		CountryOfResidence: sql.NullString{String: util.StrValue(req.CountryOfResidence), Valid: req.CountryOfResidence != nil},
		CountryOfBirth:     sql.NullString{String: util.StrValue(req.CountryOfBirth), Valid: req.CountryOfBirth != nil},
		IsActive:           sql.NullBool{Bool: util.BoolValue(req.IsActive), Valid: req.IsActive != nil},
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
// DELETE /users/:id
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
	Username string `json:"username" binding:"required,alphanum"`
	Password string `json:"password" binding:"required"`
}

type loginUserResponse struct {
	AccessToken string       `json:"access_token"`
	User        userResponse `json:"user"`
}

func (server *Server) loginUser(ctx *gin.Context) {
	var req loginUserRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	user, err := server.store.GetUserByUsername(ctx, req.Username)
	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, errorResponse(err))
			return
		}
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	err = util.CheckPassword(req.Password, user.Password)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, errorResponse(err))
		return
	}

	accessToken, err := server.tokenMaker.CreateToken(
		user.Username,
		user.UserType.String,
		server.config.AccessTokenDuration,
	)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	res := loginUserResponse{
		AccessToken: accessToken,
		User:        newUserResponse(user),
	}
	ctx.JSON(http.StatusOK, res)
}
