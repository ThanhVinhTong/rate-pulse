package api

import (
	"database/sql"
	"errors"
	"log"
	"net/http"
	"time"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
)

// createExchangeRateRequest represents the request body for creating a new exchange rate.
// Type values: 0 = both, 1 = cash, 2 = card
type createExchangeRateRequest struct {
	RateValue             string    `json:"rate_value" binding:"required"`
	SourceCurrencyID      int32     `json:"source_currency_id" binding:"required,min=1"`
	DestinationCurrencyID int32     `json:"destination_currency_id" binding:"required,min=1"`
	ValidFromDate         time.Time `json:"valid_from_date" binding:"required"`
	ValidToDate           time.Time `json:"valid_to_date"`
	SourceID              int32     `json:"source_id"`
	Type                  int32     `json:"type" binding:"min=0,max=2"`
}

// createExchangeRate handles the creation of a new exchange rate.
// It binds the JSON request body to createExchangeRateRequest, validates the input,
// and persists the exchange rate to the database.
//
// POST /admin/exchange-rates
//
// Request body: createExchangeRateRequest (JSON)
// Response: ExchangeRate object on success, error message on failure
// Status codes:
//   - 200 OK: Exchange rate created successfully
//   - 400 Bad Request: Invalid request body or validation error
//   - 500 Internal Server Error: Database or server error
func (server *Server) createExchangeRate(ctx *gin.Context) {
	var req createExchangeRateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.CreateExchangeRateParams{
		RateValue:             req.RateValue,
		SourceCurrencyID:      req.SourceCurrencyID,
		DestinationCurrencyID: req.DestinationCurrencyID,
		ValidFromDate:         req.ValidFromDate,
		ValidToDate:           sql.NullTime{Time: req.ValidToDate, Valid: !req.ValidToDate.IsZero()},
		SourceID:              sql.NullInt32{Int32: req.SourceID, Valid: req.SourceID > 0},
		TypeID:                sql.NullInt32{Int32: req.Type, Valid: req.Type > 0},
	}

	exchangeRate, err := server.store.CreateExchangeRate(ctx, arg)
	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) {
			switch pqErr.Code {
			case "23505":
				ctx.JSON(http.StatusConflict, gin.H{"error": "duplicate exchange rate"})
				return
			case "23503":
				ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid reference id"})
				return
			}
		}
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, exchangeRate)
}

// getExchangeRateRequest represents the URI parameters for fetching a single exchange rate.
// The ID must be a positive integer.
type getExchangeRateRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

// getExchangeRate retrieves a single exchange rate by its ID.
// The exchange rate ID is extracted from the URI path parameter.
//
// GET /exchange-rates/:id
//
// URI parameters:
//   - id: The unique identifier of the exchange rate (required, must be >= 1)
//
// Response: ExchangeRate object on success, error message on failure
// Status codes:
//   - 200 OK: Exchange rate retrieved successfully
//   - 400 Bad Request: Invalid or missing exchange rate ID
//   - 500 Internal Server Error: Database or server error
func (server *Server) getExchangeRate(ctx *gin.Context) {
	var req getExchangeRateRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	exchangeRate, err := server.store.GetExchangeRateByID(ctx, req.ID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "exchange rate not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, exchangeRate)
}

// listExchangeRateRequest represents the query parameters for listing exchange rates with pagination.
// PageID starts from 1 and PageSize must be between 5 and 10.
type listExchangeRateRequest struct {
	SourceCurrencyID int32 `form:"source_currency_id" binding:"required,min=1"`
	Limit            int32 `form:"limit,default=20" binding:"min=1,max=1000"`
}

// Response: Array of ExchangeRate objects on success, error message on failure
// Status codes:
//   - 200 OK: Exchange rates retrieved successfully
//   - 400 Bad Request: Invalid or missing pagination parameters
//   - 500 Internal Server Error: Database or server error
func (server *Server) listExchangeRateToday(ctx *gin.Context) {
	var req listExchangeRateRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.GetAllExchangeRatesTodayNormalisedParams{
		SourceCurrencyID: req.SourceCurrencyID,
		Limit:            req.Limit,
	}
	start := time.Now()

	dbStart := time.Now()
	exchangeRates, err := server.store.GetAllExchangeRatesTodayNormalised(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}
	log.Printf("db query took %s", time.Since(dbStart))
	log.Printf("total query took %s", time.Since(start))

	ctx.JSON(http.StatusOK, exchangeRates)
	log.Printf("handler total took %s", time.Since(start))
}

// updateExchangeRateRequest represents the request body for updating an exchange rate.
// It contains all the optional fields for exchange rate updates.
type updateExchangeRateRequest struct {
	RateValue             *string    `json:"rate_value"`
	SourceCurrencyID      *int32     `json:"source_currency_id"`
	DestinationCurrencyID *int32     `json:"destination_currency_id"`
	ValidFromDate         *time.Time `json:"valid_from_date"`
	ValidToDate           *time.Time `json:"valid_to_date"`
	SourceID              *int32     `json:"source_id"`
	TypeID                *int32     `json:"type_id"`
}

type updateExchangeRateURIRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

// updateExchangeRate handles the updating of an existing exchange rate.
// It binds the JSON request body to updateExchangeRateRequest, validates the input,
// and updates the exchange rate in the database.
//
// PUT /admin/exchange-rates/:id
// Request body: updateExchangeRateRequest (JSON)
// Response: ExchangeRate object on success, error message on failure
// Status codes:
//   - 200 OK: Exchange rate updated successfully
//   - 400 Bad Request: Invalid request body or validation error
//   - 500 Internal Server Error: Database or server error
func (server *Server) updateExchangeRate(ctx *gin.Context) {
	var uriReq updateExchangeRateURIRequest
	if err := ctx.ShouldBindUri(&uriReq); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	var req updateExchangeRateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.UpdateExchangeRateParams{
		RateID:                uriReq.ID,
		RateValue:             util.Value(req.RateValue),
		SourceCurrencyID:      util.Value(req.SourceCurrencyID),
		DestinationCurrencyID: util.Value(req.DestinationCurrencyID),
		ValidFromDate:         util.Value(req.ValidFromDate),
		ValidToDate:           sql.NullTime{Time: util.Value(req.ValidToDate), Valid: req.ValidToDate != nil},
		SourceID:              sql.NullInt32{Int32: util.Value(req.SourceID), Valid: req.SourceID != nil},
		TypeID:                sql.NullInt32{Int32: util.Value(req.TypeID), Valid: req.TypeID != nil},
	}

	exchangeRate, err := server.store.UpdateExchangeRate(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, exchangeRate)
}

// deleteExchangeRateRequest represents the URI parameters for deleting a single exchange rate.
// The ID must be a positive integer.
type deleteExchangeRateRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

// deleteExchangeRate deletes a single exchange rate by its ID.
// The exchange rate ID is extracted from the URI path parameter.
//
// DELETE /admin/exchange-rates/:id
//
// URI parameters:
//   - id: The unique identifier of the exchange rate (required, must be >= 1)
//
// Response: Success message on success, error message on failure
// Status codes:
//   - 200 OK: Exchange rate deleted successfully
//   - 400 Bad Request: Invalid or missing exchange rate ID
//   - 500 Internal Server Error: Database or server error
func (server *Server) deleteExchangeRate(ctx *gin.Context) {
	var req deleteExchangeRateRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	err := server.store.DeleteExchangeRate(ctx, req.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Exchange rate deleted successfully"})
}

// getAnalyticsRequest represents the query parameters for fetching analytics data.
// The API intelligently samples data points using NTILE bucketing to ensure
// consistent data density regardless of time range.
type getAnalyticsRequest struct {
	SourceCurrencyID      int32  `form:"source_currency_id" binding:"required,min=1"`
	DestinationCurrencyID int32  `form:"destination_currency_id" binding:"required,min=1"`
	SourceID              int32  `form:"source_id" binding:"required,min=1"`
	TimeRange             string `form:"time_range" binding:"required"` // e.g., "24h", "7d", "2w", "1m", "1y", "all"
	DataPoints            int32  `form:"data_points"`                   // Default: 50, max: 500
}

// getAnalyticsData returns exchange rate history with evenly distributed data points.
// Uses NTILE window function to bucket data and select one representative rate per bucket,
// ensuring consistent data density across all time ranges.
//
// GET /exchange-rates/analytics
//
// Query parameters:
//   - source_currency_id: The source currency ID (required, must be >= 1)
//   - destination_currency_id: The destination currency ID (required, must be >= 1)
//   - source_id: The rate source ID (required, must be >= 1)
//   - time_range: Time range (required, e.g. "24h", "7d", "2w", "1m", "1y", "all")
//   - data_points: Number of data points to return (optional, default: 50, max: 500)
//
// Response: Array of AnalyticsDataPoint objects
// Status codes:
//   - 200 OK: Analytics data retrieved successfully
//   - 400 Bad Request: Missing or invalid parameters
//   - 500 Internal Server Error: Database or server error
func (server *Server) getAnalyticsData(ctx *gin.Context) {
	var req getAnalyticsRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	// Set default and validate data_points
	if req.DataPoints == 0 {
		req.DataPoints = 50
	}
	if req.DataPoints > 500 {
		req.DataPoints = 500
	}

	// Parse time range to duration
	duration, err := util.ParseTimeRangeToDuration(req.TimeRange)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Calculate start date by subtracting duration from now
	startDate := time.Now().Add(-duration)

	rows, err := server.store.GetAnalyticsData(ctx, db.GetAnalyticsDataParams{
		SourceCurrencyID:      req.SourceCurrencyID,
		DestinationCurrencyID: req.DestinationCurrencyID,
		SourceID:              sql.NullInt32{Int32: req.SourceID, Valid: true},
		UpdatedAt:             sql.NullTime{Time: startDate, Valid: true},
		Ntile:                 req.DataPoints,
	})

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, rows)
}
