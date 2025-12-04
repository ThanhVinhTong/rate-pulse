package db

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestRefreshExchangeRates(t *testing.T) {
	store := NewStore(testDB)

	// First, create some initial exchange rates to verify they get deleted
	initialRates := []CreateExchangeRateParams{
		{
			RateValue:             "1.0000000000",
			SourceCurrencyID:      int32(1),
			DestinationCurrencyID: int32(2),
			ValidFromDate:         time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			ValidToDate:           sql.NullTime{Valid: false},
			SourceID:              sql.NullInt32{Int32: 1, Valid: true},
		},
		{
			RateValue:             "2.0000000000",
			SourceCurrencyID:      int32(2),
			DestinationCurrencyID: int32(3),
			ValidFromDate:         time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
			ValidToDate:           sql.NullTime{Valid: false},
			SourceID:              sql.NullInt32{Int32: 2, Valid: true},
		},
	}

	// Insert initial rates
	for _, rate := range initialRates {
		_, err := testQueries.CreateExchangeRate(context.Background(), rate)
		require.NoError(t, err)
	}

	// Verify initial rates exist
	allRatesBefore, err := testQueries.GetAllExchangeRates(context.Background(), GetAllExchangeRatesParams{
		Limit:  1000,
		Offset: 0,
	})
	require.NoError(t, err)
	require.GreaterOrEqual(t, len(allRatesBefore), len(initialRates))

	// Prepare new rates to refresh
	arg := RefreshExchangeRatesParams{
		Rates: []CreateExchangeRateParams{
			{
				RateValue:             "1.0500000000",
				SourceCurrencyID:      int32(1),
				DestinationCurrencyID: int32(2),
				ValidFromDate:         time.Date(2024, 1, 2, 0, 0, 0, 0, time.UTC),
				ValidToDate:           sql.NullTime{Valid: false},
				SourceID:              sql.NullInt32{Int32: 3, Valid: true},
			},
			{
				RateValue:             "25300.0000000000",
				SourceCurrencyID:      int32(1),
				DestinationCurrencyID: int32(3),
				ValidFromDate:         time.Date(2024, 1, 2, 0, 0, 0, 0, time.UTC),
				ValidToDate:           sql.NullTime{Valid: false},
				SourceID:              sql.NullInt32{Int32: 3, Valid: true},
			},
		},
	}

	// Execute the transaction
	result, err := store.RefreshExchangeRatesTx(context.Background(), arg)

	// Assert transaction succeeded
	require.NoError(t, err)
	require.NotEmpty(t, result)
	require.Equal(t, len(arg.Rates), len(result.Rates))

	// Verify all old rates are deleted and only new rates exist
	allRatesAfter, err := testQueries.GetAllExchangeRates(context.Background(), GetAllExchangeRatesParams{
		Limit:  1000,
		Offset: 0,
	})
	require.NoError(t, err)
	require.Equal(t, len(arg.Rates), len(allRatesAfter))

	// Verify the returned rates match what we inserted
	for i, expectedRate := range arg.Rates {
		actualRate := result.Rates[i]
		require.Equal(t, expectedRate.RateValue, actualRate.RateValue)
		require.Equal(t, expectedRate.SourceCurrencyID, actualRate.SourceCurrencyID)
		require.Equal(t, expectedRate.DestinationCurrencyID, actualRate.DestinationCurrencyID)
		require.Equal(t, expectedRate.ValidFromDate, actualRate.ValidFromDate)
		require.Equal(t, expectedRate.ValidToDate, actualRate.ValidToDate)
		require.Equal(t, expectedRate.SourceID, actualRate.SourceID)

		// Verify auto-generated fields
		require.NotZero(t, actualRate.RateID)
		require.True(t, actualRate.CreatedAt.Valid)
		require.True(t, actualRate.UpdatedAt.Valid)
	}

	// Verify the rates in the database match what we inserted
	for i, expectedRate := range arg.Rates {
		dbRate := allRatesAfter[i]
		require.Equal(t, expectedRate.RateValue, dbRate.RateValue)
		require.Equal(t, expectedRate.SourceCurrencyID, dbRate.SourceCurrencyID)
		require.Equal(t, expectedRate.DestinationCurrencyID, dbRate.DestinationCurrencyID)
	}
}
