package api

import (
	"net/http"
	"time"

	"github.com/ThanhVinhTong/rate-pulse/service"
	"github.com/gin-gonic/gin"
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

	exchangeRate, err := server.services.FX.CreateExchangeRate(ctx, service.CreateExchangeRateInput{
		RateValue:             req.RateValue,
		SourceCurrencyID:      req.SourceCurrencyID,
		DestinationCurrencyID: req.DestinationCurrencyID,
		ValidFromDate:         req.ValidFromDate,
		ValidToDate:           req.ValidToDate,
		SourceID:              req.SourceID,
		TypeID:                req.Type,
	})
	if err != nil {
		RespondServiceError(ctx, err)
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

	exchangeRate, err := server.services.FX.GetExchangeRate(ctx, service.GetExchangeRateInput{
		RateID: req.ID,
	})
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, exchangeRate)
}

// listExchangeRateRequest represents the query parameters for listing exchange rates with pagination.
// PageID starts from 1 and PageSize must be between 5 and 10.
type listExchangeRateRequest struct {
	SourceCurrencyID int32 `form:"source_currency_id" binding:"required,min=1"`
	Limit            int32 `form:"limit,default=20" binding:"min=1,max=2000"`
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

	exchangeRates, err := server.services.FX.ListLatestExchangeRates(ctx, service.ListLatestExchangeRatesInput{
		SourceCurrencyID: req.SourceCurrencyID,
		Limit:            req.Limit,
	})
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, exchangeRates)
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

	exchangeRate, err := server.services.FX.UpdateExchangeRate(ctx, service.UpdateExchangeRateInput{
		RateID:                uriReq.ID,
		RateValue:             req.RateValue,
		SourceCurrencyID:      req.SourceCurrencyID,
		DestinationCurrencyID: req.DestinationCurrencyID,
		ValidFromDate:         req.ValidFromDate,
		ValidToDate:           req.ValidToDate,
		SourceID:              req.SourceID,
		TypeID:                req.TypeID,
	})
	if err != nil {
		RespondServiceError(ctx, err)
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

	if err := server.services.FX.DeleteExchangeRate(ctx, service.DeleteExchangeRateInput{RateID: req.ID}); err != nil {
		RespondServiceError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Exchange rate deleted successfully"})
}

// getHistoricalRequest represents the query parameters for fetching historical data.
// The API intelligently samples data points using NTILE bucketing to ensure
// consistent data density regardless of time range.
type getHistoricalRequest struct {
	SourceCurrencyID      int32  `form:"source_currency_id" binding:"required,min=1"`
	DestinationCurrencyID int32  `form:"destination_currency_id" binding:"required,min=1"`
	SourceID              int32  `form:"source_id" binding:"required,min=1"`
	TypeID                int32  `form:"type_id" binding:"required,min=1"`
	TimeRange             string `form:"time_range" binding:"required"`
	DataPoints            int32  `form:"data_points"`
}

// getHistoricalData returns exchange rate history with evenly distributed data points.
// Uses NTILE window function to bucket data and select one representative rate per bucket,
// ensuring consistent data density across all time ranges.
//
// GET /exchange-rates/historical
//
// Query parameters:
//   - source_currency_id: The source currency ID (required, must be >= 1)
//   - destination_currency_id: The destination currency ID (required, must be >= 1)
//   - source_id: The rate source ID (required, must be >= 1)
//   - time_range: Time range (required, e.g. "24h", "7d", "2w", "1m", "1y", "all")
//   - data_points: Number of data points to return (optional, default: 50, max: 500)
//
// Response: Array of HistoricalDataPoint objects
// Status codes:
//   - 200 OK: Historical data retrieved successfully
//   - 400 Bad Request: Missing or invalid parameters
//   - 500 Internal Server Error: Database or server error
func (server *Server) getHistoricalData(ctx *gin.Context) {
	var req getHistoricalRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	rows, err := server.services.FX.GetHistoricalData(ctx, service.GetHistoricalDataInput{
		SourceCurrencyID:      req.SourceCurrencyID,
		DestinationCurrencyID: req.DestinationCurrencyID,
		SourceID:              req.SourceID,
		TypeID:                req.TypeID,
		TimeRange:             req.TimeRange,
		DataPoints:            req.DataPoints,
	})
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, rows)
}
