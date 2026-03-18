package db

import (
	"context"
	"database/sql"
	"fmt"
)

// Store provides all functions to execute database queries and transactions
type Store struct {
	*Queries
	db *sql.DB
}

// NewStore creates a new store
func NewStore(db *sql.DB) *Store {
	return &Store{
		Queries: New(db),
		db:      db,
	}
}

// execTx executes a function within a database transaction (unexported)
func (store *Store) execTx(ctx context.Context, fn func(*Queries) error) error {
	tx, err := store.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	q := New(tx)
	err = fn(q)
	if err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("tx err: %v, rb err: %v", err, rbErr)
		}
		return err
	}

	return tx.Commit()
}

// RefreshExchangeRatesParams defines the input for refreshing exchange rates
// in a single, atomic database transaction.
type RefreshExchangeRatesParams struct {
	Rates []CreateExchangeRateParams
}

// RefreshExchangeRatesResult contains the exchange rates created by the refresh.
type RefreshExchangeRatesResult struct {
	Rates []ExchangeRate
}

// RefreshExchangeRatesTx clears existing exchange rates and inserts the provided
// list of rates in a single transaction. If any insert fails, the whole
// operation is rolled back.
func (store *Store) RefreshExchangeRatesTx(ctx context.Context, arg RefreshExchangeRatesParams) (RefreshExchangeRatesResult, error) {
	var result RefreshExchangeRatesResult

	err := store.execTx(ctx, func(q *Queries) error {
		// Clear all existing exchange rates. You can change this to delete by source
		// or use a softer "invalidate" strategy if needed.
		if err := q.DeleteAllExchangeRates(ctx); err != nil {
			return err
		}

		for _, r := range arg.Rates {
			rate, err := q.CreateExchangeRate(ctx, r)
			if err != nil {
				return err
			}
			result.Rates = append(result.Rates, rate)
		}

		return nil
	})
	if err != nil {
		return RefreshExchangeRatesResult{}, err
	}

	return result, nil
}
