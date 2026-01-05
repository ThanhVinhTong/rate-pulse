package api

import (
	"database/sql"
	"errors"
	"net/http"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/token"
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
// POST /currencies
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
	}

	authPayload := ctx.MustGet(authorizationPayloadKey).(*token.Payload)
	if authPayload.UserType != UserTypeAdmin {
		ctx.JSON(http.StatusUnauthorized, errorResponse(errors.New("user is not authorized to create a country")))
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

// listCurrencyRequest represents the query parameters for listing currencies with pagination.
// PageID starts from 1 and PageSize must be between 5 and 10.
type listCurrencyRequest struct {
	PageID   int32 `form:"page_id" binding:"required,min=1"`
	PageSize int32 `form:"page_size" binding:"required,min=5,max=10"`
}

// listCurrency retrieves a paginated list of currencies.
// Pagination is controlled via query parameters page_id and page_size.
//
// GET /currencies?page_id=1&page_size=10
//
// Query parameters:
//   - page_id: The page number to retrieve (required, must be >= 1)
//   - page_size: The number of currencies per page (required, must be between 5 and 10)
//
// Response: Array of Currency objects on success, error message on failure
// Status codes:
//   - 200 OK: Currencies retrieved successfully
//   - 400 Bad Request: Invalid or missing pagination parameters
//   - 500 Internal Server Error: Database or server error
func (server *Server) listCurrency(ctx *gin.Context) {
	var req listCurrencyRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.GetAllCurrenciesParams{
		Limit:  req.PageSize,
		Offset: (req.PageID - 1) * req.PageSize,
	}

	currencies, err := server.store.GetAllCurrencies(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, currencies)
}

// TODO: Implement updateCurrency and deleteCurrency functions
