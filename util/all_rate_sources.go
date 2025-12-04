package util

import (
	"database/sql"
)

var rateSources = []map[string]interface{}{
	{
		"source_name":    "European Central Bank",
		"source_link":    sql.NullString{String: "https://www.ecb.europa.eu/stats/exchange/eurofxref/html/index.en.html", Valid: true},
		"source_country": sql.NullString{String: "Germany", Valid: true},
		"source_status":  sql.NullString{String: "active", Valid: true},
	},
	{
		"source_name":    "Bank of England",
		"source_link":    sql.NullString{String: "https://www.bankofengland.co.uk/boeapps/database/Rates.asp", Valid: true},
		"source_country": sql.NullString{String: "United Kingdom", Valid: true},
		"source_status":  sql.NullString{String: "active", Valid: true},
	},
	{
		"source_name":    "Federal Reserve",
		"source_link":    sql.NullString{String: "https://www.federalreserve.gov/releases/h10/current/", Valid: true},
		"source_country": sql.NullString{String: "United States", Valid: true},
		"source_status":  sql.NullString{String: "active", Valid: true},
	},
	{
		"source_name":    "Bank of Japan",
		"source_link":    sql.NullString{String: "https://www.boj.or.jp/en/statistics/", Valid: true},
		"source_country": sql.NullString{String: "Japan", Valid: true},
		"source_status":  sql.NullString{String: "active", Valid: true},
	},
	{
		"source_name":    "Reserve Bank of Australia",
		"source_link":    sql.NullString{String: "https://www.rba.gov.au/statistics/frequency/exchange-rates.html", Valid: true},
		"source_country": sql.NullString{String: "Australia", Valid: true},
		"source_status":  sql.NullString{String: "active", Valid: true},
	},
}

// GetAllRateSources returns a list of dummy rate sources as maps for testing purposes
func GetAllRateSources() []map[string]interface{} {
	return rateSources
}

// GetLengthRateSources returns the number of dummy rate sources
func GetLengthRateSources() int {
	return len(rateSources)
}
