package service

import (
	"context"
	"database/sql"
	"errors"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/lib/pq"
	"github.com/stretchr/testify/require"
)

func newTestFXService(t *testing.T) (*FXService, sqlmock.Sqlmock) {
	t.Helper()

	sqlDB, mock, err := sqlmock.New()
	require.NoError(t, err)

	t.Cleanup(func() {
		_ = sqlDB.Close()
	})

	return NewFXService(db.NewStore(sqlDB)), mock
}

func requireFXServiceErrorCode(t *testing.T, err error, code string) {
	t.Helper()

	require.Error(t, err)
	require.True(t, IsServiceError(err), "expected service error, got %T: %v", err, err)
	require.Equal(t, code, ServiceErrorCode(err))
}

func testExchangeRateForFXService() db.ExchangeRate {
	now := time.Date(2026, 5, 12, 12, 0, 0, 0, time.UTC)

	return db.ExchangeRate{
		RateID:                42,
		RateValue:             "17695.08",
		SourceCurrencyID:      1,
		DestinationCurrencyID: 2,
		ValidFromDate:         now,
		ValidToDate:           sql.NullTime{Time: now.Add(24 * time.Hour), Valid: true},
		SourceID:              sql.NullInt32{Int32: 10, Valid: true},
		TypeID:                sql.NullInt32{Int32: 1, Valid: true},
		CreatedAt:             sql.NullTime{Time: now, Valid: true},
		UpdatedAt:             sql.NullTime{Time: now, Valid: true},
	}
}

func exchangeRateRows(rates ...db.ExchangeRate) *sqlmock.Rows {
	rows := sqlmock.NewRows([]string{
		"rate_id",
		"rate_value",
		"source_currency_id",
		"destination_currency_id",
		"valid_from_date",
		"valid_to_date",
		"source_id",
		"updated_at",
		"created_at",
		"type_id",
	})

	for _, rate := range rates {
		rows.AddRow(
			rate.RateID,
			rate.RateValue,
			rate.SourceCurrencyID,
			rate.DestinationCurrencyID,
			rate.ValidFromDate,
			rate.ValidToDate,
			rate.SourceID,
			rate.UpdatedAt,
			rate.CreatedAt,
			rate.TypeID,
		)
	}

	return rows
}

func exchangeRateGetRows(rates ...db.ExchangeRate) *sqlmock.Rows {
	rows := sqlmock.NewRows([]string{
		"rate_id",
		"rate_value",
		"source_currency_id",
		"destination_currency_id",
		"valid_from_date",
		"valid_to_date",
		"source_id",
		"type_id",
		"created_at",
		"updated_at",
	})

	for _, rate := range rates {
		rows.AddRow(
			rate.RateID,
			rate.RateValue,
			rate.SourceCurrencyID,
			rate.DestinationCurrencyID,
			rate.ValidFromDate,
			rate.ValidToDate,
			rate.SourceID,
			rate.TypeID,
			rate.CreatedAt,
			rate.UpdatedAt,
		)
	}

	return rows
}

func TestFXServiceCreateExchangeRateInvalidInput(t *testing.T) {
	fxService, mock := newTestFXService(t)

	rate, err := fxService.CreateExchangeRate(context.Background(), CreateExchangeRateInput{
		RateValue:             "",
		SourceCurrencyID:      1,
		DestinationCurrencyID: 2,
		ValidFromDate:         time.Now(),
	})

	requireFXServiceErrorCode(t, err, ErrInvalidInput.Code)
	require.Empty(t, rate)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestFXServiceCreateExchangeRateDuplicate(t *testing.T) {
	fxService, mock := newTestFXService(t)

	now := time.Now()
	mock.ExpectQuery("INSERT INTO exchange_rates").
		WillReturnError(&pq.Error{Code: "23505", Message: "duplicate key value violates unique constraint"})

	rate, err := fxService.CreateExchangeRate(context.Background(), CreateExchangeRateInput{
		RateValue:             "17695.08",
		SourceCurrencyID:      1,
		DestinationCurrencyID: 2,
		ValidFromDate:         now,
		SourceID:              10,
		TypeID:                1,
	})

	requireFXServiceErrorCode(t, err, ErrDuplicateExchangeRate.Code)
	require.Empty(t, rate)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestFXServiceCreateExchangeRateSuccess(t *testing.T) {
	fxService, mock := newTestFXService(t)
	dbRate := testExchangeRateForFXService()

	mock.ExpectQuery("INSERT INTO exchange_rates").
		WithArgs(
			dbRate.RateValue,
			dbRate.SourceCurrencyID,
			dbRate.DestinationCurrencyID,
			dbRate.ValidFromDate,
			dbRate.ValidToDate,
			dbRate.SourceID,
			dbRate.TypeID,
		).
		WillReturnRows(exchangeRateRows(dbRate))

	rate, err := fxService.CreateExchangeRate(context.Background(), CreateExchangeRateInput{
		RateValue:             dbRate.RateValue,
		SourceCurrencyID:      dbRate.SourceCurrencyID,
		DestinationCurrencyID: dbRate.DestinationCurrencyID,
		ValidFromDate:         dbRate.ValidFromDate,
		ValidToDate:           dbRate.ValidToDate.Time,
		SourceID:              dbRate.SourceID.Int32,
		TypeID:                dbRate.TypeID.Int32,
	})

	require.NoError(t, err)
	require.Equal(t, dbRate.RateID, rate.RateID)
	require.Equal(t, dbRate.RateValue, rate.RateValue)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestFXServiceGetExchangeRateInvalidID(t *testing.T) {
	fxService, mock := newTestFXService(t)

	rate, err := fxService.GetExchangeRate(context.Background(), GetExchangeRateInput{RateID: 0})

	requireFXServiceErrorCode(t, err, ErrInvalidInput.Code)
	require.Empty(t, rate)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestFXServiceGetExchangeRateNotFound(t *testing.T) {
	fxService, mock := newTestFXService(t)

	mock.ExpectQuery("SELECT rate_id, rate_value").
		WithArgs(int32(404)).
		WillReturnError(sql.ErrNoRows)

	rate, err := fxService.GetExchangeRate(context.Background(), GetExchangeRateInput{RateID: 404})

	requireFXServiceErrorCode(t, err, ErrNotFound.Code)
	require.Empty(t, rate)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestFXServiceGetExchangeRateSuccess(t *testing.T) {
	fxService, mock := newTestFXService(t)
	dbRate := testExchangeRateForFXService()

	mock.ExpectQuery("SELECT rate_id, rate_value").
		WithArgs(dbRate.RateID).
		WillReturnRows(exchangeRateGetRows(dbRate))

	rate, err := fxService.GetExchangeRate(context.Background(), GetExchangeRateInput{RateID: dbRate.RateID})

	require.NoError(t, err)
	require.Equal(t, dbRate.RateID, rate.RateID)
	require.Equal(t, dbRate.SourceID.Int32, rate.SourceID)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestFXServiceListLatestExchangeRatesInvalidLimit(t *testing.T) {
	fxService, mock := newTestFXService(t)

	rates, err := fxService.ListLatestExchangeRates(context.Background(), ListLatestExchangeRatesInput{
		SourceCurrencyID: 1,
		Limit:            1001,
	})

	requireFXServiceErrorCode(t, err, ErrInvalidInput.Code)
	require.Nil(t, rates)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestFXServiceListLatestExchangeRatesSuccess(t *testing.T) {
	fxService, mock := newTestFXService(t)
	now := time.Now()

	mock.ExpectQuery("SELECT DISTINCT ON").
		WithArgs(int32(1), int32(20)).
		WillReturnRows(sqlmock.NewRows([]string{
			"rate_id",
			"rate_value",
			"source_currency_code",
			"destination_currency_code",
			"valid_from_date",
			"rate_source_code",
			"type_name",
			"updated_at",
		}).AddRow(
			42,
			"17695.08",
			"AUD",
			"VND",
			now,
			sql.NullString{String: "VCB", Valid: true},
			sql.NullString{String: "Buy Cash", Valid: true},
			sql.NullTime{Time: now, Valid: true},
		))

	rates, err := fxService.ListLatestExchangeRates(context.Background(), ListLatestExchangeRatesInput{
		SourceCurrencyID: 1,
		Limit:            20,
	})

	require.NoError(t, err)
	require.Len(t, rates, 1)
	require.Equal(t, "AUD", rates[0].SourceCurrencyCode)
	require.Equal(t, "VCB", rates[0].RateSourceCode)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestFXServiceUpdateExchangeRateNotFound(t *testing.T) {
	fxService, mock := newTestFXService(t)

	rateValue := "18000.00"
	mock.ExpectQuery("UPDATE exchange_rates").
		WithArgs(
			int32(42),
			sql.NullString{String: rateValue, Valid: true},
			sql.NullInt32{},
			sql.NullInt32{},
			sql.NullTime{},
			sql.NullTime{},
			sql.NullInt32{},
			sql.NullInt32{},
		).
		WillReturnError(sql.ErrNoRows)

	rate, err := fxService.UpdateExchangeRate(context.Background(), UpdateExchangeRateInput{
		RateID:    42,
		RateValue: &rateValue,
	})

	requireFXServiceErrorCode(t, err, ErrNotFound.Code)
	require.Empty(t, rate)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestFXServiceUpdateExchangeRateSuccess(t *testing.T) {
	fxService, mock := newTestFXService(t)

	rateValue := "18000.00"
	updatedRate := testExchangeRateForFXService()
	updatedRate.RateValue = rateValue

	mock.ExpectQuery("UPDATE exchange_rates").
		WithArgs(
			updatedRate.RateID,
			sql.NullString{String: rateValue, Valid: true},
			sql.NullInt32{},
			sql.NullInt32{},
			sql.NullTime{},
			sql.NullTime{},
			sql.NullInt32{},
			sql.NullInt32{},
		).
		WillReturnRows(exchangeRateRows(updatedRate))

	rate, err := fxService.UpdateExchangeRate(context.Background(), UpdateExchangeRateInput{
		RateID:    updatedRate.RateID,
		RateValue: &rateValue,
	})

	require.NoError(t, err)
	require.Equal(t, rateValue, rate.RateValue)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestFXServiceDeleteExchangeRateInvalidID(t *testing.T) {
	fxService, mock := newTestFXService(t)

	err := fxService.DeleteExchangeRate(context.Background(), DeleteExchangeRateInput{RateID: 0})

	requireFXServiceErrorCode(t, err, ErrInvalidInput.Code)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestFXServiceDeleteExchangeRateDBError(t *testing.T) {
	fxService, mock := newTestFXService(t)

	mock.ExpectExec("DELETE FROM exchange_rates").
		WithArgs(int32(42)).
		WillReturnError(errors.New("database unavailable"))

	err := fxService.DeleteExchangeRate(context.Background(), DeleteExchangeRateInput{RateID: 42})

	requireFXServiceErrorCode(t, err, ErrInternal.Code)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestFXServiceDeleteExchangeRateSuccess(t *testing.T) {
	fxService, mock := newTestFXService(t)

	mock.ExpectExec("DELETE FROM exchange_rates").
		WithArgs(int32(42)).
		WillReturnResult(sqlmock.NewResult(0, 1))

	err := fxService.DeleteExchangeRate(context.Background(), DeleteExchangeRateInput{RateID: 42})

	require.NoError(t, err)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestFXServiceGetHistoricalDataInvalidTimeRange(t *testing.T) {
	fxService, mock := newTestFXService(t)

	points, err := fxService.GetHistoricalData(context.Background(), GetHistoricalDataInput{
		SourceCurrencyID:      1,
		DestinationCurrencyID: 2,
		SourceID:              10,
		TypeID:                1,
		TimeRange:             "bad",
	})

	requireFXServiceErrorCode(t, err, ErrInvalidInput.Code)
	require.Nil(t, points)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestFXServiceGetHistoricalDataSuccess(t *testing.T) {
	fxService, mock := newTestFXService(t)
	now := time.Now()

	mock.ExpectQuery("WITH bucketed AS").
		WithArgs(
			int32(1),
			int32(2),
			sql.NullInt32{Int32: 10, Valid: true},
			sqlmock.AnyArg(),
			sql.NullInt32{Int32: 1, Valid: true},
			int32(50),
		).
		WillReturnRows(sqlmock.NewRows([]string{
			"rate_value",
			"updated_at",
			"type_id",
		}).AddRow(
			"17695.08",
			sql.NullTime{Time: now, Valid: true},
			sql.NullInt32{Int32: 1, Valid: true},
		))

	points, err := fxService.GetHistoricalData(context.Background(), GetHistoricalDataInput{
		SourceCurrencyID:      1,
		DestinationCurrencyID: 2,
		SourceID:              10,
		TypeID:                1,
		TimeRange:             "24h",
	})

	require.NoError(t, err)
	require.Len(t, points, 1)
	require.Equal(t, "17695.08", points[0].RateValue)
	require.Equal(t, int32(1), points[0].TypeID)
	require.NoError(t, mock.ExpectationsWereMet())
}
