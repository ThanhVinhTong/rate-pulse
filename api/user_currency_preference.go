package api

import (
	"database/sql"
	"errors"
	"net/http"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/gin-gonic/gin"
)

type createCurrencyPreferenceRequest struct {
	CurrencyID   int32  `json:"currency_id" binding:"required,min=1"`
	IsFavorite   *bool  `json:"is_favorite"`
	DisplayOrder *int32 `json:"display_order"`
}

// createCurrencyPreference creates a new currency preference for the authenticated user.
// It validates the request body, verifies the currency exists, and creates the preference.
//
// POST /currency-preference
//
// Request body parameters:
//   - currency_id: Currency ID (required, min: 1)
//   - is_favorite: Mark as favorite (optional)
//   - display_order: Display order (optional)
//
// Response: UserCurrencyPreference object on success, error message on failure
// Status codes:
//   - 200 OK: Preference created successfully
//   - 400 Bad Request: Invalid request body
//   - 404 Not Found: Currency or user not found
//   - 500 Internal Server Error: Database or server error
func (server *Server) createCurrencyPreference(ctx *gin.Context) {
	var req createCurrencyPreferenceRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Verify currency exists
	if err := server.verifyCurrencyExists(ctx, req.CurrencyID); err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "currency not found" {
			statusCode = http.StatusNotFound
		}
		ctx.JSON(statusCode, errorResponse(err))
		return
	}

	user, err := server.getAuthenticatedUser(ctx)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "user not found" {
			statusCode = http.StatusNotFound
		}
		ctx.JSON(statusCode, errorResponse(err))
		return
	}

	nullFav, nullOrder := convertPreferenceFields(req.IsFavorite, req.DisplayOrder)

	arg := db.CreateCurrencyPreferenceParams{
		CurrencyID:   req.CurrencyID,
		UserID:       user.UserID,
		IsFavorite:   nullFav,
		DisplayOrder: nullOrder,
	}

	currencyPreference, err := server.store.CreateCurrencyPreference(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, currencyPreference)
}

type deleteCurrencyPreferenceRequest struct {
	CurrencyID int32 `uri:"currency_id" binding:"required,min=1"`
}

// deleteCurrencyPreference deletes a currency preference for the authenticated user.
// It validates the URI parameter, verifies the currency exists, and deletes the preference.
//
// DELETE /currency-preference/:currency_id
//
// URI parameters:
//   - currency_id: Currency ID (required, min: 1)
//
// Response: Success message on deletion, error message on failure
// Status codes:
//   - 200 OK: Preference deleted successfully
//   - 400 Bad Request: Invalid URI parameter
//   - 404 Not Found: Currency, user, or preference not found
//   - 500 Internal Server Error: Database or server error
func (server *Server) deleteCurrencyPreference(ctx *gin.Context) {
	var req deleteCurrencyPreferenceRequest

	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Verify currency exists
	if err := server.verifyCurrencyExists(ctx, req.CurrencyID); err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "currency not found" {
			statusCode = http.StatusNotFound
		}
		ctx.JSON(statusCode, errorResponse(err))
		return
	}

	// Get user from database using username from token
	user, err := server.getAuthenticatedUser(ctx)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "user not found" {
			statusCode = http.StatusNotFound
		}
		ctx.JSON(statusCode, errorResponse(err))
		return
	}

	arg := db.DeleteCurrencyPreferenceParams{
		CurrencyID: req.CurrencyID,
		UserID:     user.UserID,
	}

	err = server.store.DeleteCurrencyPreference(ctx, arg)
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

type listAllCurrencyPreferencesRequest struct {
	PageID   int32 `form:"page_id" binding:"required,min=1"`
	PageSize int32 `form:"page_size" binding:"required,min=5,max=10"`
}

// listAllCurrencyPreferences retrieves all currency preferences with pagination (admin only).
// It validates pagination parameters, checks admin authorization, and returns all preferences.
//
// GET /currency-preferences?page_id=1&page_size=10
//
// Query parameters:
//   - page_id: Page number (required, min: 1)
//   - page_size: Items per page (required, min: 5, max: 10)
//
// Response: Paginated list of UserCurrencyPreference objects on success, error message on failure
// Status codes:
//   - 200 OK: Preferences retrieved successfully
//   - 400 Bad Request: Invalid query parameters
//   - 401 Unauthorized: User is not an admin
//   - 500 Internal Server Error: Database or server error
func (server *Server) listAllCurrencyPreferences(ctx *gin.Context) {
	var req listAllCurrencyPreferencesRequest

	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	authPayload := ctx.MustGet(authorizationPayloadKey).(*token.Payload)
	if authPayload.UserType != UserTypeAdmin {
		ctx.JSON(http.StatusUnauthorized, errorResponse(errors.New("user is not authorized to list currency preferences")))
		return
	}

	arg := db.GetAllCurrencyPreferencesParams{
		Limit:  req.PageSize,
		Offset: (req.PageID - 1) * req.PageSize,
	}

	currencyPreferences, err := server.store.GetAllCurrencyPreferences(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, currencyPreferences)
}

type getCurrencyPreferencesByCurrencyIDRequest struct {
	CurrencyID int32 `uri:"currency_id" binding:"required,min=1"`
	PageID     int32 `form:"page_id"`
	PageSize   int32 `form:"page_size"`
}

// getCurrencyPreferencesByCurrencyID retrieves paginated currency preferences for a specific currency and authenticated user.
// It validates URI and query parameters, verifies the currency exists, and returns the preferences.
//
// GET /currency-preference-currid/:currency_id?page_id=1&page_size=10
//
// URI parameters:
//   - currency_id: Currency ID (required, min: 1)
//
// Query parameters:
//   - page_id: Page number (required, min: 1)
//   - page_size: Items per page (required, min: 5, max: 10)
//
// Response: Paginated list of UserCurrencyPreference objects on success, error message on failure
// Status codes:
//   - 200 OK: Preferences retrieved successfully
//   - 400 Bad Request: Invalid URI or query parameters
//   - 404 Not Found: Currency, user, or preference not found
//   - 500 Internal Server Error: Database or server error
func (server *Server) getCurrencyPreferencesByCurrencyID(ctx *gin.Context) {
	var req getCurrencyPreferencesByCurrencyIDRequest

	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Manual validation for query parameters
	if req.PageID < 1 {
		ctx.JSON(http.StatusBadRequest, errorResponse(errors.New("page_id must be at least 1")))
		return
	}
	if req.PageSize < 5 || req.PageSize > 10 {
		ctx.JSON(http.StatusBadRequest, errorResponse(errors.New("page_size must be between 5 and 10")))
		return
	}

	// Verify currency exists
	if err := server.verifyCurrencyExists(ctx, req.CurrencyID); err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "currency not found" {
			statusCode = http.StatusNotFound
		}
		ctx.JSON(statusCode, errorResponse(err))
		return
	}

	// Get user from database using username from token
	user, err := server.getAuthenticatedUser(ctx)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "user not found" {
			statusCode = http.StatusNotFound
		}
		ctx.JSON(statusCode, errorResponse(err))
		return
	}

	arg := db.GetCurrencyPreferencesByCurrencyIDParams{
		CurrencyID: req.CurrencyID,
		UserID:     user.UserID,
		Limit:      req.PageSize,
		Offset:     (req.PageID - 1) * req.PageSize,
	}

	currencyPreferences, err := server.store.GetCurrencyPreferencesByCurrencyID(ctx, arg)
	if err != nil {
		if err == sql.ErrNoRows {
			ctx.JSON(http.StatusNotFound, errorResponse(errors.New("preference not found")))
			return
		}
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, currencyPreferences)
}

type getCurrencyPreferencesByUserIDRequest struct {
	PageID   int32 `form:"page_id" binding:"required,min=1"`
	PageSize int32 `form:"page_size" binding:"required,min=5,max=10"`
}

// getCurrencyPreferencesByUserID retrieves paginated currency preferences for the authenticated user.
// It validates pagination parameters, retrieves the user ID from token, and returns the preferences.
//
// GET /currency-preference-userid?page_id=1&page_size=10
//
// Query parameters:
//   - page_id: Page number (required, min: 1)
//   - page_size: Items per page (required, min: 5, max: 10)
//
// Response: Paginated list of UserCurrencyPreference objects on success, error message on failure
// Status codes:
//   - 200 OK: Preferences retrieved successfully
//   - 400 Bad Request: Invalid query parameters
//   - 404 Not Found: User not found
//   - 500 Internal Server Error: Database or server error
func (server *Server) getCurrencyPreferencesByUserID(ctx *gin.Context) {
	var req getCurrencyPreferencesByUserIDRequest

	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Get user from database using username from token
	user, err := server.getAuthenticatedUser(ctx)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "user not found" {
			statusCode = http.StatusNotFound
		}
		ctx.JSON(statusCode, errorResponse(err))
		return
	}

	arg := db.GetCurrencyPreferencesByUserIDParams{
		UserID: user.UserID,
		Limit:  req.PageSize,
		Offset: (req.PageID - 1) * req.PageSize,
	}

	currencyPreferences, err := server.store.GetCurrencyPreferencesByUserID(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, currencyPreferences)
}

type updateCurrencyPreferenceRequest struct {
	IsFavorite   *bool  `json:"is_favorite"`
	DisplayOrder *int32 `json:"display_order"`
	CurrencyID   int32  `json:"currency_id" binding:"required,min=1"`
}

// updateCurrencyPreference updates an existing currency preference for the authenticated user.
// It validates the request body, verifies the currency exists, and updates the preference.
//
// PUT /currency-preference/:currency_id
//
// URI parameters:
//   - currency_id: Currency ID (from URL path)
//
// Request body parameters:
//   - currency_id: Currency ID (required, min: 1)
//   - is_favorite: Mark as favorite (optional)
//   - display_order: Display order (optional)
//
// Response: Updated UserCurrencyPreference object on success, error message on failure
// Status codes:
//   - 200 OK: Preference updated successfully
//   - 400 Bad Request: Invalid request body
//   - 404 Not Found: Currency or user not found
//   - 500 Internal Server Error: Database or server error
func (server *Server) updateCurrencyPreference(ctx *gin.Context) {
	var req updateCurrencyPreferenceRequest

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Verify currency exists
	if err := server.verifyCurrencyExists(ctx, req.CurrencyID); err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "currency not found" {
			statusCode = http.StatusNotFound
		}
		ctx.JSON(statusCode, errorResponse(err))
		return
	}

	// Get user from database using username from token
	user, err := server.getAuthenticatedUser(ctx)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "user not found" {
			statusCode = http.StatusNotFound
		}
		ctx.JSON(statusCode, errorResponse(err))
		return
	}

	nullFav, nullOrder := convertPreferenceFields(req.IsFavorite, req.DisplayOrder)

	arg := db.UpdateCurrencyPreferenceParams{
		IsFavorite:   nullFav,
		DisplayOrder: nullOrder,
		CurrencyID:   req.CurrencyID,
		UserID:       user.UserID,
	}

	currencyPreferences, err := server.store.UpdateCurrencyPreference(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, currencyPreferences)
}

// Helper functions
func (server *Server) getAuthenticatedUser(ctx *gin.Context) (*db.User, error) {
	authPayload := ctx.MustGet(authorizationPayloadKey).(*token.Payload)
	user, err := server.store.GetUserByUsername(ctx, authPayload.Username)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

func (server *Server) verifyCurrencyExists(ctx *gin.Context, currencyID int32) error {
	_, err := server.store.GetCurrencyByID(ctx, currencyID)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("currency not found")
		}
		return err
	}
	return nil
}

func convertPreferenceFields(isFavorite *bool, displayOrder *int32) (sql.NullBool, sql.NullInt32) {
	var nullFavorite sql.NullBool
	if isFavorite != nil {
		nullFavorite = sql.NullBool{Bool: *isFavorite, Valid: true}
	}

	var nullOrder sql.NullInt32
	if displayOrder != nil {
		nullOrder = sql.NullInt32{Int32: *displayOrder, Valid: true}
	}

	return nullFavorite, nullOrder
}
