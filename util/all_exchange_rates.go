package util

import (
	"database/sql"
	"time"
)

// rate_id, rate_value, source_currency_id, destination_currency_id, valid_from_date, valid_to_date, source_id, updated_at, created_at

// exchange rate's API

var exchangeRates = []map[string]interface{}{
	{
		"rate_value":              "1.0500000000",
		"source_currency_id":      int32(1), // USD
		"destination_currency_id": int32(2), // EUR
		"valid_from_date":         time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		"valid_to_date":           sql.NullTime{Valid: false},
		"source_id":               sql.NullInt32{Int32: 3, Valid: true}, // Federal Reserve (USD base)
	},
	{
		"rate_value":              "0.9500000000",
		"source_currency_id":      int32(2), // EUR
		"destination_currency_id": int32(1), // USD
		"valid_from_date":         time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		"valid_to_date":           sql.NullTime{Valid: false},
		"source_id":               sql.NullInt32{Int32: 1, Valid: true}, // European Central Bank (EUR base)
	},
	{
		"rate_value":              "25300.0000000000",
		"source_currency_id":      int32(1), // USD
		"destination_currency_id": int32(3), // VND
		"valid_from_date":         time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		"valid_to_date":           sql.NullTime{Valid: false},
		"source_id":               sql.NullInt32{Int32: 3, Valid: true}, // Federal Reserve
	},
	{
		"rate_value":              "0.0000395000",
		"source_currency_id":      int32(3), // VND
		"destination_currency_id": int32(1), // USD
		"valid_from_date":         time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		"valid_to_date":           sql.NullTime{Valid: false},
		"source_id":               sql.NullInt32{Int32: 3, Valid: true}, // Federal Reserve
	},
	{
		"rate_value":              "0.6500000000",
		"source_currency_id":      int32(4), // AUD
		"destination_currency_id": int32(1), // USD
		"valid_from_date":         time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		"valid_to_date":           sql.NullTime{Valid: false},
		"source_id":               sql.NullInt32{Int32: 5, Valid: true}, // Reserve Bank of Australia
	},
	{
		"rate_value":              "1.5400000000",
		"source_currency_id":      int32(1), // USD
		"destination_currency_id": int32(4), // AUD
		"valid_from_date":         time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		"valid_to_date":           sql.NullTime{Valid: false},
		"source_id":               sql.NullInt32{Int32: 5, Valid: true}, // Reserve Bank of Australia
	},
	{
		"rate_value":              "0.0067000000",
		"source_currency_id":      int32(5), // JPY
		"destination_currency_id": int32(1), // USD
		"valid_from_date":         time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		"valid_to_date":           sql.NullTime{Valid: false},
		"source_id":               sql.NullInt32{Int32: 4, Valid: true}, // Bank of Japan
	},
	{
		"rate_value":              "149.5000000000",
		"source_currency_id":      int32(1), // USD
		"destination_currency_id": int32(5), // JPY
		"valid_from_date":         time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		"valid_to_date":           sql.NullTime{Valid: false},
		"source_id":               sql.NullInt32{Int32: 4, Valid: true}, // Bank of Japan
	},
	{
		"rate_value":              "26800.0000000000",
		"source_currency_id":      int32(2), // EUR
		"destination_currency_id": int32(3), // VND
		"valid_from_date":         time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
		"valid_to_date":           sql.NullTime{Valid: false},
		"source_id":               sql.NullInt32{Int32: 1, Valid: true}, // European Central Bank (EUR base)
	},
}

// GetAllExchangeRates returns a list of dummy exchange rates as maps for testing purposes
func GetAllExchangeRates() []map[string]interface{} {
	return exchangeRates
}

// GetLengthExchangeRates returns the number of dummy exchange rates
func GetLengthExchangeRates() int {
	return len(exchangeRates)
}
