package api

import (
	"database/sql"
	"net/http"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// HashPassword generates a bcrypt hash from the given password.
// Uses bcrypt's default cost factor for a balance of security and performance.
func HashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}

// CheckPassword compares a plaintext password with a hashed password.
// Returns nil if they match, or an error if they don't.
func CheckPassword(password, hashedPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

// createUserRequest represents the request body for creating a new user.
// It contains all the required and optional fields for user registration.
type createUserRequest struct {
	Username           string `json:"username" binding:"required"`
	Email              string `json:"email" binding:"required,email"`
	Password           string `json:"password" binding:"required"`
	UserType           string `json:"user_type" binding:"required,oneof=free premium enterprise"`
	EmailVerified      bool   `json:"email_verified" binding:"boolean"`
	TimeZone           string `json:"time_zone"`
	LanguagePreference string `json:"language_preference"`
	CountryOfResidence string `json:"country_of_residence"`
	CountryOfBirth     string `json:"country_of_birth"`
	IsActive           bool   `json:"is_active" binding:"required,boolean"`
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
	hashedPassword, err := HashPassword(req.Password)
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
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, user)
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

	ctx.JSON(http.StatusOK, user)
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

	ctx.JSON(http.StatusOK, users)
}

// TODO: Implement updateUser and deleteUser functions
