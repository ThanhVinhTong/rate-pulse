package api

import (
	"net/http"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/gin-gonic/gin"
)

// createCountryRequest represents the request body for creating a new country.
// Each country must be linked to an existing currency.
type createCountryRequest struct {
	CountryName string `json:"country_name" binding:"required"`
	CurrencyID  int32  `json:"currency_id" binding:"required,min=1"`
}

// createCountry handles the creation of a new country.
// It binds the JSON request body to createCountryRequest, validates the input,
// and persists the country to the database.
//
// POST /countries
//
// Request body: createCountryRequest (JSON)
// Response: Country object on success, error message on failure
// Status codes:
//   - 200 OK: Country created successfully
//   - 400 Bad Request: Invalid request body or validation error
//   - 500 Internal Server Error: Database or server error (e.g., invalid currency_id)
func (server *Server) createCountry(ctx *gin.Context) {
	var req createCountryRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.CreateCountryParams{
		CountryName: req.CountryName,
		CurrencyID:  req.CurrencyID,
	}

	country, err := server.store.CreateCountry(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, country)
}

// getCountryRequest represents the URI parameters for fetching a single country.
// The ID must be a positive integer.
type getCountryRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

// getCountry retrieves a single country by its ID.
// The country ID is extracted from the URI path parameter.
//
// GET /countries/:id
//
// URI parameters:
//   - id: The unique identifier of the country (required, must be >= 1)
//
// Response: Country object on success, error message on failure
// Status codes:
//   - 200 OK: Country retrieved successfully
//   - 400 Bad Request: Invalid or missing country ID
//   - 500 Internal Server Error: Database or server error
func (server *Server) getCountry(ctx *gin.Context) {
	var req getCountryRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	country, err := server.store.GetCountryByID(ctx, req.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, country)
}

// listCountryRequest represents the query parameters for listing countries with pagination.
// PageID starts from 1 and PageSize must be between 5 and 10.
type listCountryRequest struct {
	PageID   int32 `form:"page_id" binding:"required,min=1"`
	PageSize int32 `form:"page_size" binding:"required,min=5,max=10"`
}

// listCountry retrieves a paginated list of countries.
// Pagination is controlled via query parameters page_id and page_size.
//
// GET /countries?page_id=1&page_size=10
//
// Query parameters:
//   - page_id: The page number to retrieve (required, must be >= 1)
//   - page_size: The number of countries per page (required, must be between 5 and 10)
//
// Response: Array of Country objects on success, error message on failure
// Status codes:
//   - 200 OK: Countries retrieved successfully
//   - 400 Bad Request: Invalid or missing pagination parameters
//   - 500 Internal Server Error: Database or server error
func (server *Server) listCountry(ctx *gin.Context) {
	var req listCountryRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
	}

	arg := db.GetAllCountriesParams{
		Limit:  req.PageSize,
		Offset: (req.PageID - 1) * req.PageSize,
	}
	countries, err := server.store.GetAllCountries(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, countries)
}

// TODO: Implement updateCountry and deleteCountry functions
