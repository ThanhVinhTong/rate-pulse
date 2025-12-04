package db

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/stretchr/testify/require"
)

// TestCreateExchangeRate tests the CreateExchangeRate database operation.
// This test verifies that:
// - A new exchange rate can be successfully created in the database
// - All provided fields are correctly stored and returned
// - Auto-generated fields (ID, timestamps) are properly set
// - Null-able fields are handled correctly
func TestCreateExchangeRate(t *testing.T) {
	// Prepare test data for creating exchange rates
	// Using real exchange rate data makes the test more meaningful
	exchangeRates := util.GetAllExchangeRates()
	for _, rate := range exchangeRates {
		arg := CreateExchangeRateParams{
			RateValue:             rate["rate_value"].(string),
			SourceCurrencyID:      rate["source_currency_id"].(int32),
			DestinationCurrencyID: rate["destination_currency_id"].(int32),
			ValidFromDate:         rate["valid_from_date"].(time.Time),
			ValidToDate:           rate["valid_to_date"].(sql.NullTime),
			SourceID:              rate["source_id"].(sql.NullInt32),
		}

		// Execute the CreateExchangeRate query using the test database connection
		exchangeRate, err := testQueries.CreateExchangeRate(context.Background(), arg)

		// Assert that no error occurred during the database operation
		require.NoError(t, err)

		// Assert that the returned exchange rate object is not empty
		require.NotEmpty(t, exchangeRate)

		// Verify that all input fields were correctly stored and returned
		require.Equal(t, arg.RateValue, exchangeRate.RateValue)
		require.Equal(t, arg.SourceCurrencyID, exchangeRate.SourceCurrencyID)
		require.Equal(t, arg.DestinationCurrencyID, exchangeRate.DestinationCurrencyID)
		require.Equal(t, arg.ValidFromDate, exchangeRate.ValidFromDate)
		require.Equal(t, arg.ValidToDate, exchangeRate.ValidToDate)
		require.Equal(t, arg.SourceID, exchangeRate.SourceID)

		// Verify that auto-generated fields are properly set by the database
		// RateID should be a non-zero value (auto-incremented primary key)
		require.NotZero(t, exchangeRate.RateID)

		// UpdatedAt and CreatedAt timestamps should be set by database triggers/defaults
		require.True(t, exchangeRate.UpdatedAt.Valid)
		require.True(t, exchangeRate.CreatedAt.Valid)
		require.NotZero(t, exchangeRate.UpdatedAt.Time)
		require.NotZero(t, exchangeRate.CreatedAt.Time)
	}
}

func TestGetExchangeRateByID(t *testing.T) {
	// Use the first exchange rate that was created in TestCreateExchangeRate (should have ID 1)
	rateID := int32(1)
	exchangeRateFromDB, err := testQueries.GetExchangeRateByID(context.Background(), rateID)

	require.NoError(t, err)
	require.NotEmpty(t, exchangeRateFromDB)

	// Verify it has the expected data (first exchange rate in our list)
	require.Equal(t, "1.0500000000", exchangeRateFromDB.RateValue)
	require.Equal(t, int32(1), exchangeRateFromDB.SourceCurrencyID)      // USD
	require.Equal(t, int32(2), exchangeRateFromDB.DestinationCurrencyID) // EUR
	require.Equal(t, time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC), exchangeRateFromDB.ValidFromDate)
	require.False(t, exchangeRateFromDB.ValidToDate.Valid)
	require.True(t, exchangeRateFromDB.SourceID.Valid)
	require.Equal(t, int32(3), exchangeRateFromDB.SourceID.Int32) // Federal Reserve

	// Verify auto-generated fields are set
	require.NotZero(t, exchangeRateFromDB.RateID)
	require.True(t, exchangeRateFromDB.UpdatedAt.Valid)
	require.True(t, exchangeRateFromDB.CreatedAt.Valid)
}

func TestGetAllExchangeRates(t *testing.T) {
	exchangeRates, err := testQueries.GetAllExchangeRates(context.Background(), GetAllExchangeRatesParams{
		Limit:  1000,
		Offset: 0,
	})
	require.NoError(t, err)
	require.NotEmpty(t, exchangeRates)
	require.Equal(t, util.GetLengthExchangeRates(), len(exchangeRates))
}

func TestUpdateExchangeRate(t *testing.T) {
	rateID := int32(1)

	arg := UpdateExchangeRateParams{
		RateID:                rateID,
		RateValue:             "1.0600000000",
		SourceCurrencyID:      int32(1), // USD
		DestinationCurrencyID: int32(2), // EUR
		ValidFromDate:         time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		ValidToDate:           sql.NullTime{Valid: false},
		SourceID:              sql.NullInt32{Int32: 3, Valid: true}, // Federal Reserve
	}

	exchangeRate, err := testQueries.UpdateExchangeRate(context.Background(), arg)
	require.NoError(t, err)
	require.NotEmpty(t, exchangeRate)
	require.Equal(t, arg.RateValue, exchangeRate.RateValue)
	require.Equal(t, arg.SourceCurrencyID, exchangeRate.SourceCurrencyID)
	require.Equal(t, arg.DestinationCurrencyID, exchangeRate.DestinationCurrencyID)
	require.Equal(t, arg.ValidFromDate, exchangeRate.ValidFromDate)
	require.Equal(t, arg.ValidToDate, exchangeRate.ValidToDate)
	require.Equal(t, arg.SourceID, exchangeRate.SourceID)
}

func TestDeleteExchangeRate(t *testing.T) {
	// Use a transaction and temporary data so we don't affect global seed data or FKs.
	ctx := context.Background()
	tx, err := testDB.BeginTx(ctx, nil)
	require.NoError(t, err)
	defer tx.Rollback()

	q := New(tx)

	// Create temporary currencies for the exchange rate
	baseCurrency, err := q.CreateCurrency(ctx, CreateCurrencyParams{
		CurrencyCode:    "TMP",
		CurrencyName:    "Temporary Base",
		CurrencyCountry: sql.NullString{String: "TempLand", Valid: true},
		CurrencySymbol:  sql.NullString{String: "T", Valid: true},
	})
	require.NoError(t, err)

	destCurrency, err := q.CreateCurrency(ctx, CreateCurrencyParams{
		CurrencyCode:    "TMQ",
		CurrencyName:    "Temporary Dest",
		CurrencyCountry: sql.NullString{String: "TempLand", Valid: true},
		CurrencySymbol:  sql.NullString{String: "Q", Valid: true},
	})
	require.NoError(t, err)

	// Create a temporary rate source
	tempSource, err := q.CreateRateSource(ctx, CreateRateSourceParams{
		SourceName:    "Temp Delete Rate Source",
		SourceLink:    sql.NullString{String: "https://temp-delete-rate-source.local", Valid: true},
		SourceCountry: sql.NullString{String: "TempLand", Valid: true},
		SourceStatus:  sql.NullString{String: "inactive", Valid: true},
	})
	require.NoError(t, err)

	// Create a temporary exchange rate that we will delete
	tempRate, err := q.CreateExchangeRate(ctx, CreateExchangeRateParams{
		RateValue:             "9.9900000000",
		SourceCurrencyID:      baseCurrency.CurrencyID,
		DestinationCurrencyID: destCurrency.CurrencyID,
		ValidFromDate:         time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		ValidToDate:           sql.NullTime{Valid: false},
		SourceID:              sql.NullInt32{Int32: tempSource.SourceID, Valid: true},
	})
	require.NoError(t, err)
	require.NotZero(t, tempRate.RateID)

	// Delete the temporary exchange rate
	err = q.DeleteExchangeRate(ctx, tempRate.RateID)
	require.NoError(t, err)

	// Verify it was deleted within the transaction
	exchangeRate, err := q.GetExchangeRateByID(ctx, tempRate.RateID)
	require.Error(t, err)
	require.Empty(t, exchangeRate)

	// When the transaction rolls back, the database is restored (no permanent change)
}
