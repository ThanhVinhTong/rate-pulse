/*
fx service is responsible for handling foreign exchange rate use cases.
It provides methods for creating, reading, listing, updating, deleting, and retrieving historical FX rates.
*/
package service

import (
	"context"
	"database/sql"
	"errors"
	"time"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/lib/pq"
)

type FXService struct {
	store db.Store
}

func NewFXService(store db.Store) *FXService {
	return &FXService{store: store}
}

/*
CreateExchangeRate Service is responsible for creating a new exchange rate.
- Validate required rate fields and positive reference IDs
- Build db.CreateExchangeRateParams
- Convert database constraint failures into service errors
*/
func (s *FXService) CreateExchangeRate(ctx context.Context, input CreateExchangeRateInput) (ExchangeRate, error) {
	if err := validateExchangeRateValues(
		input.RateValue,
		input.SourceCurrencyID,
		input.DestinationCurrencyID,
		input.ValidFromDate,
		input.ValidToDate,
	); err != nil {
		return ExchangeRate{}, err
	}

	rate, err := s.store.CreateExchangeRate(ctx, db.CreateExchangeRateParams{
		RateValue:             input.RateValue,
		SourceCurrencyID:      input.SourceCurrencyID,
		DestinationCurrencyID: input.DestinationCurrencyID,
		ValidFromDate:         input.ValidFromDate,
		ValidToDate:           sql.NullTime{Time: input.ValidToDate, Valid: !input.ValidToDate.IsZero()},
		SourceID:              sql.NullInt32{Int32: input.SourceID, Valid: input.SourceID > 0},
		TypeID:                sql.NullInt32{Int32: input.TypeID, Valid: input.TypeID > 0},
	})
	if err != nil {
		return ExchangeRate{}, wrapExchangeRateDBError(err, "failed to create exchange rate")
	}

	return NewExchangeRate(rate), nil
}

/*
GetExchangeRate Service is responsible for getting an exchange rate by ID.
- Validate rate_id > 0
- Call store.GetExchangeRateByID
- Convert database row into service model
*/
func (s *FXService) GetExchangeRate(ctx context.Context, input GetExchangeRateInput) (ExchangeRate, error) {
	if input.RateID <= 0 {
		return ExchangeRate{}, Wrap(nil, ErrInvalidInput.Code, "rate_id must be greater than 0")
	}

	rate, err := s.store.GetExchangeRateByID(ctx, input.RateID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ExchangeRate{}, Wrap(err, ErrNotFound.Code, "exchange rate not found")
		}
		return ExchangeRate{}, Wrap(err, ErrInternal.Code, "failed to get exchange rate by id")
	}

	return NewExchangeRateFromGetRow(rate), nil
}

/*
ListLatestExchangeRates Service is responsible for listing current normalized exchange rates.
- Validate source currency and limit
- Delegate latest-rate selection to the repository query
- Convert database rows into service models
*/
func (s *FXService) ListLatestExchangeRates(ctx context.Context, input ListLatestExchangeRatesInput) ([]LatestExchangeRate, error) {
	if input.SourceCurrencyID <= 0 {
		return nil, Wrap(nil, ErrInvalidInput.Code, "source_currency_id must be greater than 0")
	}
	if input.Limit <= 0 || input.Limit > 10000 {
		return nil, Wrap(nil, ErrInvalidInput.Code, "limit must be between 1 and 10000")
	}

	rates, err := s.store.GetAllExchangeRatesTodayNormalised(ctx, db.GetAllExchangeRatesTodayNormalisedParams{
		SourceCurrencyID: input.SourceCurrencyID,
		Limit:            input.Limit,
	})
	if err != nil {
		return nil, Wrap(err, ErrInternal.Code, "failed to list latest exchange rates")
	}

	res := make([]LatestExchangeRate, len(rates))
	for i, rate := range rates {
		res[i] = NewLatestExchangeRate(rate)
	}
	return res, nil
}

/*
UpdateExchangeRate Service is responsible for updating an exchange rate by ID.
- Validate rate_id and any provided IDs/dates
- Build db.UpdateExchangeRateParams from optional fields
- Return ErrNotFound when no row exists
*/
func (s *FXService) UpdateExchangeRate(ctx context.Context, input UpdateExchangeRateInput) (ExchangeRate, error) {
	if input.RateID <= 0 {
		return ExchangeRate{}, Wrap(nil, ErrInvalidInput.Code, "rate_id must be greater than 0")
	}
	if input.RateValue != nil && *input.RateValue == "" {
		return ExchangeRate{}, Wrap(nil, ErrInvalidInput.Code, "rate_value is required")
	}
	if input.SourceCurrencyID != nil && *input.SourceCurrencyID <= 0 {
		return ExchangeRate{}, Wrap(nil, ErrInvalidInput.Code, "source_currency_id must be greater than 0")
	}
	if input.DestinationCurrencyID != nil && *input.DestinationCurrencyID <= 0 {
		return ExchangeRate{}, Wrap(nil, ErrInvalidInput.Code, "destination_currency_id must be greater than 0")
	}
	if input.SourceID != nil && *input.SourceID <= 0 {
		return ExchangeRate{}, Wrap(nil, ErrInvalidInput.Code, "source_id must be greater than 0")
	}
	if input.TypeID != nil && *input.TypeID <= 0 {
		return ExchangeRate{}, Wrap(nil, ErrInvalidInput.Code, "type_id must be greater than 0")
	}
	if input.ValidFromDate != nil && input.ValidFromDate.IsZero() {
		return ExchangeRate{}, Wrap(nil, ErrInvalidInput.Code, "valid_from_date is required")
	}
	if input.ValidFromDate != nil && input.ValidToDate != nil && !input.ValidToDate.IsZero() && input.ValidToDate.Before(*input.ValidFromDate) {
		return ExchangeRate{}, Wrap(nil, ErrInvalidInput.Code, "valid_to_date must be after valid_from_date")
	}

	rate, err := s.store.UpdateExchangeRate(ctx, db.UpdateExchangeRateParams{
		RateID:                input.RateID,
		RateValue:             sql.NullString{String: util.Value(input.RateValue), Valid: input.RateValue != nil},
		SourceCurrencyID:      sql.NullInt32{Int32: util.Value(input.SourceCurrencyID), Valid: input.SourceCurrencyID != nil},
		DestinationCurrencyID: sql.NullInt32{Int32: util.Value(input.DestinationCurrencyID), Valid: input.DestinationCurrencyID != nil},
		ValidFromDate:         sql.NullTime{Time: util.Value(input.ValidFromDate), Valid: input.ValidFromDate != nil},
		ValidToDate:           sql.NullTime{Time: util.Value(input.ValidToDate), Valid: input.ValidToDate != nil},
		SourceID:              sql.NullInt32{Int32: util.Value(input.SourceID), Valid: input.SourceID != nil},
		TypeID:                sql.NullInt32{Int32: util.Value(input.TypeID), Valid: input.TypeID != nil},
	})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ExchangeRate{}, Wrap(err, ErrNotFound.Code, "exchange rate not found")
		}
		return ExchangeRate{}, wrapExchangeRateDBError(err, "failed to update exchange rate")
	}

	return NewExchangeRate(rate), nil
}

/*
DeleteExchangeRate Service is responsible for deleting an exchange rate by ID.
- Validate rate_id > 0
- Call store.DeleteExchangeRate
- Convert DB errors to service errors
*/
func (s *FXService) DeleteExchangeRate(ctx context.Context, input DeleteExchangeRateInput) error {
	if input.RateID <= 0 {
		return Wrap(nil, ErrInvalidInput.Code, "rate_id must be greater than 0")
	}

	if err := s.store.DeleteExchangeRate(ctx, input.RateID); err != nil {
		return Wrap(err, ErrInternal.Code, "failed to delete exchange rate")
	}

	return nil
}

/*
GetHistoricalData Service is responsible for fetching sampled historical FX data.
- Validate currency/source/type IDs
- Normalize data point count to API bounds
- Convert the requested time range into a repository start date
*/
func (s *FXService) GetHistoricalData(ctx context.Context, input GetHistoricalDataInput) ([]HistoricalDataPoint, error) {
	if input.SourceCurrencyID <= 0 {
		return nil, Wrap(nil, ErrInvalidInput.Code, "source_currency_id must be greater than 0")
	}
	if input.DestinationCurrencyID <= 0 {
		return nil, Wrap(nil, ErrInvalidInput.Code, "destination_currency_id must be greater than 0")
	}
	if input.SourceID <= 0 {
		return nil, Wrap(nil, ErrInvalidInput.Code, "source_id must be greater than 0")
	}
	if input.TypeID <= 0 {
		return nil, Wrap(nil, ErrInvalidInput.Code, "type_id must be greater than 0")
	}

	dataPoints := input.DataPoints
	if dataPoints == 0 {
		dataPoints = 50
	}
	if dataPoints > 500 {
		dataPoints = 500
	}
	if dataPoints < 0 {
		return nil, Wrap(nil, ErrInvalidInput.Code, "data_points must be greater than or equal to 0")
	}

	duration, err := util.ParseTimeRangeToDuration(input.TimeRange)
	if err != nil {
		return nil, Wrap(err, ErrInvalidInput.Code, err.Error())
	}

	rows, err := s.store.GetHistoricalData(ctx, db.GetHistoricalDataParams{
		SourceCurrencyID:      input.SourceCurrencyID,
		DestinationCurrencyID: input.DestinationCurrencyID,
		SourceID:              sql.NullInt32{Int32: input.SourceID, Valid: true},
		UpdatedAt:             sql.NullTime{Time: time.Now().Add(-duration), Valid: true},
		TypeID:                sql.NullInt32{Int32: input.TypeID, Valid: true},
		Ntile:                 dataPoints,
	})
	if err != nil {
		return nil, Wrap(err, ErrInternal.Code, "failed to get historical exchange rates")
	}

	res := make([]HistoricalDataPoint, len(rows))
	for i, row := range rows {
		res[i] = NewHistoricalDataPoint(row)
	}
	return res, nil
}

func validateExchangeRateValues(rateValue string, sourceCurrencyID, destinationCurrencyID int32, validFromDate, validToDate time.Time) error {
	if rateValue == "" {
		return Wrap(nil, ErrInvalidInput.Code, "rate_value is required")
	}
	if sourceCurrencyID <= 0 {
		return Wrap(nil, ErrInvalidInput.Code, "source_currency_id must be greater than 0")
	}
	if destinationCurrencyID <= 0 {
		return Wrap(nil, ErrInvalidInput.Code, "destination_currency_id must be greater than 0")
	}
	if validFromDate.IsZero() {
		return Wrap(nil, ErrInvalidInput.Code, "valid_from_date is required")
	}
	if !validToDate.IsZero() && validToDate.Before(validFromDate) {
		return Wrap(nil, ErrInvalidInput.Code, "valid_to_date must be after valid_from_date")
	}
	return nil
}

func wrapExchangeRateDBError(err error, defaultMessage string) error {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) {
		switch pqErr.Code {
		case "23505":
			return Wrap(err, ErrDuplicateExchangeRate.Code, ErrDuplicateExchangeRate.Message)
		case "23503":
			return Wrap(err, ErrInvalidInput.Code, "invalid reference id")
		}
	}
	return Wrap(err, ErrInternal.Code, defaultMessage)
}
