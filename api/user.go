package api

import (
	"database/sql"
	"net/http"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/gin-gonic/gin"
)

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

// createUser handles the creation of a new user
func (server *Server) createUser(ctx *gin.Context) {
	var req createUserRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.CreateUserParams{
		Username:           req.Username,
		Email:              req.Email,
		Password:           req.Password,
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
