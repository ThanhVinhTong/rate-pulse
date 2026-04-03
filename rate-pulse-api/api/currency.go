package api

import (
	"database/sql"
	"net/http"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/gin-gonic/gin"
)

// createCurrencyRequest represents the request body for creating a new currency.
// All fields are required for currency registration.
type createCurrencyRequest struct {
	CurrencyCode   string `json:"currency_code" binding:"required"`
	CurrencyName   string `json:"currency_name" binding:"required"`
	CurrencySymbol string `json:"currency_symbol" binding:"required"`
}

// createCurrency handles the creation of a new currency.
// It binds the JSON request body to createCurrencyRequest, validates the input,
// and persists the currency to the database.
//
// POST /admin/currencies
//
// Request body: createCurrencyRequest (JSON)
// Response: Currency object on success, error message on failure
// Status codes:
//   - 200 OK: Currency created successfully
//   - 400 Bad Request: Invalid request body or validation error
//   - 500 Internal Server Error: Database or server error
func (server *Server) createCurrency(ctx *gin.Context) {
	var req createCurrencyRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.CreateCurrencyParams{
		CurrencyCode:   req.CurrencyCode,
		CurrencyName:   req.CurrencyName,
		CurrencySymbol: sql.NullString{String: req.CurrencySymbol, Valid: true},
	}

	currency, err := server.store.CreateCurrency(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, currency)
}

// getCurrencyRequest represents the URI parameters for fetching a single currency.
// The ID must be a positive integer.
type getCurrencyRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

// getCurrency retrieves a single currency by its ID.
// The currency ID is extracted from the URI path parameter.
//
// GET /currencies/:id
//
// URI parameters:
//   - id: The unique identifier of the currency (required, must be >= 1)
//
// Response: Currency object on success, error message on failure
// Status codes:
//   - 200 OK: Currency retrieved successfully
//   - 400 Bad Request: Invalid or missing currency ID
//   - 500 Internal Server Error: Database or server error
func (server *Server) getCurrency(ctx *gin.Context) {
	var req getCurrencyRequest

	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	currency, err := server.store.GetCurrencyByID(ctx, req.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, currency)
}

// listCurrency retrieves a list of all currencies.
//
// GET /currencies
//
// Response: Array of Currency objects on success, error message on failure
// Status codes:
//   - 200 OK: Currencies retrieved successfully
//   - 500 Internal Server Error: Database or server error
func (server *Server) listCurrency(ctx *gin.Context) {
	currencies, err := server.store.GetAllCurrencies(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, currencies)
}

// updateCurrencyRequest represents the request body for updating a currency.
// It contains all the optional fields for currency updates.
type updateCurrencyRequest struct {
	CurrencyCode   *string `json:"currency_code"`
	CurrencyName   *string `json:"currency_name"`
	CurrencySymbol *string `json:"currency_symbol"`
}

type updateCurrencyURIRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

// updateCurrency handles the updating of an existing currency.
// It binds the JSON request body to updateCurrencyRequest, validates the input,
// and updates the currency in the database.
//
// PUT /admin/currencies/:id
// Request body: updateCurrencyRequest (JSON)
// Response: Currency object on success, error message on failure
// Status codes:
//   - 200 OK: Currency updated successfully
//   - 400 Bad Request: Invalid request body or validation error
//   - 500 Internal Server Error: Database or server error
func (server *Server) updateCurrency(ctx *gin.Context) {
	var uriReq updateCurrencyURIRequest
	if err := ctx.ShouldBindUri(&uriReq); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	var req updateCurrencyRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.UpdateCurrencyParams{
		CurrencyID:     uriReq.ID,
		CurrencyCode:   util.Value(req.CurrencyCode),
		CurrencyName:   util.Value(req.CurrencyName),
		CurrencySymbol: sql.NullString{String: util.Value(req.CurrencySymbol), Valid: req.CurrencySymbol != nil},
	}

	currency, err := server.store.UpdateCurrency(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, currency)
}

// deleteCurrencyRequest represents the URI parameters for deleting a single currency.
// The ID must be a positive integer.
type deleteCurrencyRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

// deleteCurrency deletes a single currency by its ID.
// The currency ID is extracted from the URI path parameter.
//
// DELETE /admin/currencies/:id
//
// URI parameters:
//   - id: The unique identifier of the currency (required, must be >= 1)
//
// Response: Success message on success, error message on failure
// Status codes:
//   - 200 OK: Currency deleted successfully
//   - 400 Bad Request: Invalid or missing currency ID
//   - 500 Internal Server Error: Database or server error
func (server *Server) deleteCurrency(ctx *gin.Context) {
	var req deleteCurrencyRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	err := server.store.DeleteCurrency(ctx, req.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Currency deleted successfully"})
}
