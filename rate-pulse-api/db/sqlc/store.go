package db

import (
	"context"
	"database/sql"
	"fmt"
)

// Store provides all functions to execute database queries and transactions.
type Store interface {
	Querier
	PingContext(ctx context.Context) error
	CreateUserTx(ctx context.Context, arg CreateUserTxParams) (CreateUserTxResult, error)
	VerifyEmailTx(ctx context.Context, arg VerifyEmailTxParams) (VerifyEmailTxResult, error)
	RefreshExchangeRatesTx(ctx context.Context, arg RefreshExchangeRatesParams) (RefreshExchangeRatesResult, error)
}

type SQLStore struct {
	*Queries
	db *sql.DB
}

// NewStore creates a new store
func NewStore(db *sql.DB) Store {
	return &SQLStore{
		Queries: New(db),
		db:      db,
	}
}

func (store *SQLStore) PingContext(ctx context.Context) error {
	return store.db.PingContext(ctx)
}

// VerifyEmailTxParams defines the input for atomically consuming a verification
// email record and marking the owning user as email verified.
type VerifyEmailTxParams struct {
	EmailID        int64
	UserID         int32
	SecretCodeHash string
}

// VerifyEmailTxResult contains the consumed verification record and updated user.
type VerifyEmailTxResult struct {
	VerifyEmail VerifyEmail
	User        User
}

// VerifyEmailTx marks a valid, unused verification email as used and marks the
// associated user as email verified in one transaction.
func (store *SQLStore) VerifyEmailTx(ctx context.Context, arg VerifyEmailTxParams) (VerifyEmailTxResult, error) {
	var result VerifyEmailTxResult

	err := store.execTx(ctx, func(q *Queries) error {
		verifyEmail, err := q.UpdateVerifyEmail(ctx, UpdateVerifyEmailParams{
			ID:             arg.EmailID,
			UserID:         arg.UserID,
			SecretCodeHash: arg.SecretCodeHash,
		})
		if err != nil {
			return err
		}

		user, err := q.UpdateUserEmailVerified(ctx, verifyEmail.UserID)
		if err != nil {
			return err
		}

		result.VerifyEmail = verifyEmail
		result.User = user
		return nil
	})
	if err != nil {
		return VerifyEmailTxResult{}, err
	}

	return result, nil
}

// execTx executes a function within a database transaction (unexported)
func (store *SQLStore) execTx(ctx context.Context, fn func(*Queries) error) error {
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
func (store *SQLStore) RefreshExchangeRatesTx(ctx context.Context, arg RefreshExchangeRatesParams) (RefreshExchangeRatesResult, error) {
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
