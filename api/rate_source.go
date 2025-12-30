package api

import (
	"database/sql"
	"net/http"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/gin-gonic/gin"
)

// createRateSourceRequest represents the request body for creating a new rate source.
// All fields are required for rate source registration.
type createRateSourceRequest struct {
	SourceName    string `json:"source_name" binding:"required"`
	SourceLink    string `json:"source_link" binding:"required"`
	SourceCountry string `json:"source_country" binding:"required"`
	SourceStatus  string `json:"source_status" binding:"required"`
}

// createRateSource handles the creation of a new rate source.
// It binds the JSON request body to createRateSourceRequest, validates the input,
// and persists the rate source to the database.
//
// POST /rate-sources
//
// Request body: createRateSourceRequest (JSON)
// Response: RateSource object on success, error message on failure
// Status codes:
//   - 200 OK: Rate source created successfully
//   - 400 Bad Request: Invalid request body or validation error
//   - 500 Internal Server Error: Database or server error
func (server *Server) createRateSource(ctx *gin.Context) {
	var req createRateSourceRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
	}

	arg := db.CreateRateSourceParams{
		SourceName:    req.SourceName,
		SourceLink:    sql.NullString{String: req.SourceLink, Valid: true},
		SourceCountry: sql.NullString{String: req.SourceCountry, Valid: true},
		SourceStatus:  sql.NullString{String: req.SourceStatus, Valid: true},
	}

	rateSource, err := server.store.CreateRateSource(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, rateSource)
}

// getRateSourceRequest represents the URI parameters for fetching a single rate source.
// The ID must be a positive integer.
type getRateSourceRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

// getRateSource retrieves a single rate source by its ID.
// The rate source ID is extracted from the URI path parameter.
//
// GET /rate-sources/:id
//
// URI parameters:
//   - id: The unique identifier of the rate source (required, must be >= 1)
//
// Response: RateSource object on success, error message on failure
// Status codes:
//   - 200 OK: Rate source retrieved successfully
//   - 400 Bad Request: Invalid or missing rate source ID
//   - 500 Internal Server Error: Database or server error
func (server *Server) getRateSource(ctx *gin.Context) {
	var req getRateSourceRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
	}

	rateSource, err := server.store.GetRateSourceByID(ctx, req.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, rateSource)
}

// listRateSourceRequest represents the query parameters for listing rate sources with pagination.
// PageID starts from 1 and PageSize must be between 5 and 10.
type listRateSourceRequest struct {
	PageID   int32 `form:"page_id" binding:"required,min=1"`
	PageSize int32 `form:"page_size" binding:"required,min=5,max=10"`
}

// listRateSource retrieves a paginated list of rate sources.
// Pagination is controlled via query parameters page_id and page_size.
//
// GET /rate-sources?page_id=1&page_size=10
//
// Query parameters:
//   - page_id: The page number to retrieve (required, must be >= 1)
//   - page_size: The number of rate sources per page (required, must be between 5 and 10)
//
// Response: Array of RateSource objects on success, error message on failure
// Status codes:
//   - 200 OK: Rate sources retrieved successfully
//   - 400 Bad Request: Invalid or missing pagination parameters
//   - 500 Internal Server Error: Database or server error
func (server *Server) listRateSource(ctx *gin.Context) {
	var req listRateSourceRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.GetAllRateSourcesParams{
		Limit:  req.PageSize,
		Offset: (req.PageID - 1) * req.PageSize,
	}

	rateSources, err := server.store.GetAllRateSources(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, rateSources)
}

// TODO: Implement updateRateSource and deleteRateSource functions
