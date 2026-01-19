package api

import (
	"database/sql"
	"errors"
	"net/http"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/gin-gonic/gin"
)

// createRateSourcePreferenceRequest is the request to
// create a user's rate source preference
type createRateSourcePreferenceRequest struct {
	SourceID  int32 `json:"source_id" binding:"required,min=1"`
	IsPrimary *bool `json:"is_primary"`
}

// createRateSourcePreference handles the creation of a new rate source preference for the authenticated user.
// It validates the source exists, retrieves the user ID from db, and creates the preference.
//
// POST /rate-source-preferences
//
// Request body: createRateSourcePreferenceRequest (JSON)
// Response: UserRateSourcePreference object on success, error message on failure
// Status codes:
//   - 200 OK: Preference created successfully
//   - 400 Bad Request: Invalid request body or validation error
//   - 404 Not Found: Rate source or user not found
//   - 500 Internal Server Error: Database or server error
func (server *Server) createRateSourcePreference(ctx *gin.Context) {
	var req createRateSourcePreferenceRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Get authenticated user from token
	authPayload := ctx.MustGet(authorizationPayloadKey).(*token.Payload)

	// Verify source exists
	_, err := server.store.GetRateSourceByID(ctx, req.SourceID)
	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, errorResponse(errors.New("rate source not found")))
			return
		}
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	// Get user from database using username from token
	user, err := server.store.GetUserByUsername(ctx, authPayload.Username)
	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, errorResponse(errors.New("user not found")))
			return
		}
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	// Convert *bool to sql.NullBool
	var isPrimary sql.NullBool
	if req.IsPrimary != nil {
		isPrimary = sql.NullBool{
			Bool:  *req.IsPrimary,
			Valid: true,
		}
	}

	arg := db.CreateRateSourcePreferenceParams{
		SourceID:  req.SourceID,
		UserID:    user.UserID,
		IsPrimary: isPrimary,
	}

	rateSourcePreference, err := server.store.CreateRateSourcePreference(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, rateSourcePreference)
}

type deleteRateSourcePreferenceRequest struct {
	SourceID int32 `uri:"source_id" binding:"required,min=1"`
}

// deleteRateSourcePreference handles the deletion of a rate source preference for the authenticated user.
// It validates the source exists, retrieves the user ID from db, and deletes the preference.
//
// DELETE /rate-source-preferences/:source_id
//
// URI parameter: source_id (int32)
// Response: Success message on deletion, error message on failure
// Status codes:
//   - 200 OK: Preference deleted successfully
//   - 400 Bad Request: Invalid URI parameter
//   - 404 Not Found: Rate source, user, or preference not found
//   - 500 Internal Server Error: Database or server error
func (server *Server) deleteRateSourcePreference(ctx *gin.Context) {
	var req deleteRateSourcePreferenceRequest

	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Get authenticated user from token
	authPayload := ctx.MustGet(authorizationPayloadKey).(*token.Payload)

	// Verify source exists
	_, err := server.store.GetRateSourceByID(ctx, req.SourceID)
	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, errorResponse(errors.New("rate source not found")))
			return
		}
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	// Get user from database using username from token
	user, err := server.store.GetUserByUsername(ctx, authPayload.Username)
	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, errorResponse(errors.New("user not found")))
			return
		}
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	arg := db.DeleteRateSourcePreferenceParams{
		SourceID: req.SourceID,
		UserID:   user.UserID, // Get ID from db
	}

	err = server.store.DeleteRateSourcePreference(ctx, arg)
	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, errorResponse(errors.New("preference not found")))
			return
		}
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "preference deleted successfully"})
}

type getRateSourcePreferencesBySourceIDRequest struct {
	PageID   int32 `form:"page_id" binding:"required,min=1"`
	PageSize int32 `form:"page_size" binding:"required,min=5,max=10"`
}

// getRateSourcePreferencesBySourceID retrieves all rate source preferences for the authenticated user.
// It fetches the user from db and returns their preferences filtered by source.
//
// GET /rate-source-preferences-sourceid?page_id=1&page_size=10
//
// Response: List of UserRateSourcePreference objects on success, error message on failure
// Status codes:
//   - 200 OK: Preferences retrieved successfully
//   - 404 Not Found: User not found
//   - 500 Internal Server Error: Database or server error
func (server *Server) getRateSourcePreferencesBySourceID(ctx *gin.Context) {
	var req getRateSourcePreferencesBySourceIDRequest

	// Get authenticated user from token
	authPayload := ctx.MustGet(authorizationPayloadKey).(*token.Payload)

	// Get user from database using username from token
	user, err := server.store.GetUserByUsername(ctx, authPayload.Username)
	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, errorResponse(errors.New("user not found")))
			return
		}
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	arg := db.GetRateSourcePreferencesBySourceIDParams{
		Email: user.Email,
		Limit:  req.PageSize,
		Offset: (req.PageID - 1) * req.PageSize,
	}

	rateSourcePreference, err := server.store.GetRateSourcePreferencesBySourceID(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, rateSourcePreference)
}

type getRateSourcePreferencesByUserIDRequest struct {
	PageID   int32 `form:"page_id" binding:"required,min=1"`
	PageSize int32 `form:"page_size" binding:"required,min=5,max=10"`
}

// getRateSourcePreferencesByUserID retrieves paginated rate source preferences for the authenticated user.
// It validates pagination parameters, retrieves the user ID from db, and returns the preferences.
//
// GET /rate-source-preferences-userid?page_id=1&page_size=10
//
// Query parameters:
//   - page_id: Page number (min: 1)
//   - page_size: Items per page (min: 5, max: 10)
//
// Response: Paginated list of UserRateSourcePreference objects on success, error message on failure
// Status codes:
//   - 200 OK: Preferences retrieved successfully
//   - 400 Bad Request: Invalid query parameters
//   - 404 Not Found: User not found
//   - 500 Internal Server Error: Database or server error
func (server *Server) getRateSourcePreferencesByUserID(ctx *gin.Context) {
	var req getRateSourcePreferencesByUserIDRequest

	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Get authenticated user from token
	authPayload := ctx.MustGet(authorizationPayloadKey).(*token.Payload)

	// Get user from database using username from token
	user, err := server.store.GetUserByUsername(ctx, authPayload.Username)
	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, errorResponse(errors.New("user not found")))
			return
		}
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	arg := db.GetRateSourcePreferencesByUserIDParams{
		UserID: user.UserID,
		Limit:  req.PageSize,
		Offset: (req.PageID - 1) * req.PageSize,
	}

	rateSourcePreference, err := server.store.GetRateSourcePreferencesByUserID(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, rateSourcePreference)
}

type updateRateSourcePreferenceRequest struct {
	SourceID  int32 `uri:"source_id" binding:"required,min=1"`
	IsPrimary *bool `json:"is_primary"`
}

// updateRateSourcePreference handles updating an existing rate source preference for the authenticated user.
// It validates the source exists, retrieves the user ID from db, and updates the preference.
//
// PUT /rate-source-preferences/:source_id
//
// URI parameter: source_id (int32)
// Request body: updateRateSourcePreferenceRequest (JSON)
// Response: Updated UserRateSourcePreference object on success, error message on failure
// Status codes:
//   - 200 OK: Preference updated successfully
//   - 400 Bad Request: Invalid URI parameter or request body
//   - 404 Not Found: Rate source or user not found
//   - 500 Internal Server Error: Database or server error
func (server *Server) updateRateSourcePreference(ctx *gin.Context) {

	var req updateRateSourcePreferenceRequest

	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Get authenticated user from token
	authPayload := ctx.MustGet(authorizationPayloadKey).(*token.Payload)

	// Verify source exists
	_, err := server.store.GetRateSourceByID(ctx, req.SourceID)
	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, errorResponse(errors.New("rate source not found")))
			return
		}
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	// Get user from database using username from token
	user, err := server.store.GetUserByUsername(ctx, authPayload.Username)
	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, errorResponse(errors.New("user not found")))
			return
		}
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	// Convert *bool to sql.NullBool
	var isPrimary sql.NullBool
	if req.IsPrimary != nil {
		isPrimary = sql.NullBool{
			Bool:  *req.IsPrimary,
			Valid: true,
		}
	}

	arg := db.UpdateRateSourcePreferenceParams{
		IsPrimary: isPrimary,
		SourceID:  req.SourceID,
		UserID:    user.UserID,
	}

	rateSourcePreference, err := server.store.UpdateRateSourcePreference(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, rateSourcePreference)
}

// list all preferences with pagination
type listRateSourcePreferencesRequest struct {
	PageID   int32 `form:"page_id" binding:"required,min=1"`
	PageSize int32 `form:"page_size" binding:"required,min=5,max=10"`
}

// listAllRateSourcePreferences retrieves all rate source preferences across all users with pagination.
// This endpoint is restricted to admin users only. It validates admin authorization and returns paginated results.
//
// GET /rate-source-preferences?page_id=1&page_size=10
//
// Query parameters:
//   - page_id: Page number (min: 1)
//   - page_size: Items per page (min: 5, max: 10)
//
// Response: Paginated list of all UserRateSourcePreference objects on success, error message on failure
// Status codes:
//   - 200 OK: Preferences retrieved successfully
//   - 400 Bad Request: Invalid query parameters
//   - 401 Unauthorized: User is not an admin
//   - 500 Internal Server Error: Database or server error
func (server *Server) listAllRateSourcePreferences(ctx *gin.Context) {
	var req listRateSourcePreferencesRequest

	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	authPayload := ctx.MustGet(authorizationPayloadKey).(*token.Payload)
	if authPayload.UserType != UserTypeAdmin {
		ctx.JSON(http.StatusUnauthorized, errorResponse(errors.New("user is not authorized to list rate source preferences")))
		return
	}

	arg := db.GetAllRateSourcePreferencesParams{
		Limit:  req.PageSize,
		Offset: (req.PageID - 1) * req.PageSize,
	}

	rateSourcePreferences, err := server.store.GetAllRateSourcePreferences(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, rateSourcePreferences)
}
