package db

import (
	"context"
	"database/sql"
	"fmt"
	"testing"

	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/stretchr/testify/require"
)

func TestCreateRateSource(t *testing.T) {
	rateSources := util.GetAllRateSources()
	fmt.Printf("Total rate sources to test: %d\n", len(rateSources))
	for i, rateSource := range rateSources {
		fmt.Printf("Testing rate source %d: %s\n",
			i+1,
			rateSource["source_name"])

		arg := CreateRateSourceParams{
			SourceName:    rateSource["source_name"].(string),
			SourceLink:    rateSource["source_link"].(sql.NullString),
			SourceCountry: rateSource["source_country"].(sql.NullString),
			SourceStatus:  rateSource["source_status"].(sql.NullString),
		}
		fmt.Printf("  Created params: %+v\n", arg)
		source, err := testQueries.CreateRateSource(context.Background(), arg)

		if err != nil {
			fmt.Printf("  Error creating rate source: %v\n", err)
		} else {
			fmt.Printf("  Successfully created rate source with ID: %d\n", source.SourceID)
		}

		require.NoError(t, err)
		require.NotEmpty(t, source)

		require.Equal(t, arg.SourceName, source.SourceName)
		require.Equal(t, arg.SourceLink, source.SourceLink)
		require.Equal(t, arg.SourceCountry, source.SourceCountry)
		require.Equal(t, arg.SourceStatus, source.SourceStatus)

		// Verify auto-generated fields are set
		require.NotZero(t, source.SourceID)
		require.NotZero(t, source.UpdatedAt)
		require.NotZero(t, source.CreatedAt)

		fmt.Printf("  Completed testing rate source %d\n\n", i+1)
	}
}

func TestGetRateSourceByID(t *testing.T) {
	sourceID := int32(1)
	sourceFromDB, err := testQueries.GetRateSourceByID(context.Background(), sourceID)

	require.NoError(t, err)
	require.NotEmpty(t, sourceFromDB)

	// Verify it has the expected ECB data (first source in our list)
	require.Equal(t, "European Central Bank", sourceFromDB.SourceName)
	require.Equal(t, "Germany", sourceFromDB.SourceCountry.String)
	require.Equal(t, "https://www.ecb.europa.eu/stats/exchange/eurofxref/html/index.en.html", sourceFromDB.SourceLink.String)
	require.Equal(t, "active", sourceFromDB.SourceStatus.String)

	// Verify auto-generated fields are set
	require.NotZero(t, sourceFromDB.SourceID)
	require.NotZero(t, sourceFromDB.UpdatedAt)
	require.NotZero(t, sourceFromDB.CreatedAt)
}

func TestGetAllRateSources(t *testing.T) {
	sources, err := testQueries.GetAllRateSources(context.Background(), GetAllRateSourcesParams{
		Limit:  10,
		Offset: 0,
	})
	require.NoError(t, err)
	require.NotEmpty(t, sources)
	require.Equal(t, util.GetLengthRateSources(), len(sources))
}

func TestUpdateRateSource(t *testing.T) {
	sourceID := int32(1)

	arg := UpdateRateSourceParams{
		SourceID:      sourceID,
		SourceName:    "European Central Bank",
		SourceLink:    sql.NullString{String: "https://www.ecb.europa.eu/stats/exchange/eurofxref/html/index.en.html", Valid: true},
		SourceCountry: sql.NullString{String: "European Union", Valid: true},
		SourceStatus:  sql.NullString{String: "active", Valid: true},
	}

	source, err := testQueries.UpdateRateSource(context.Background(), arg)
	require.NoError(t, err)
	require.NotEmpty(t, source)
	require.Equal(t, arg.SourceName, source.SourceName)
	require.Equal(t, arg.SourceCountry, source.SourceCountry)
}

func TestDeleteRateSource(t *testing.T) {
	// Use a transaction and a temporary rate source so we don't violate FK constraints
	ctx := context.Background()
	tx, err := testDB.BeginTx(ctx, nil)
	require.NoError(t, err)
	defer tx.Rollback()

	q := New(tx)

	// Create a temporary rate source just for this delete test
	tempArg := CreateRateSourceParams{
		SourceName:    "Temp Delete Source",
		SourceLink:    sql.NullString{String: "https://temp-delete-source.local", Valid: true},
		SourceCountry: sql.NullString{String: "Nowhere", Valid: true},
		SourceStatus:  sql.NullString{String: "inactive", Valid: true},
	}

	tempSource, err := q.CreateRateSource(ctx, tempArg)
	require.NoError(t, err)
	require.NotZero(t, tempSource.SourceID)

	// Delete the temporary rate source
	err = q.DeleteRateSource(ctx, tempSource.SourceID)
	require.NoError(t, err)

	// Verify it was deleted within the transaction
	source, err := q.GetRateSourceByID(ctx, tempSource.SourceID)
	require.Error(t, err)
	require.Empty(t, source)

	// When the transaction rolls back, the database is restored (no permanent change)
}
