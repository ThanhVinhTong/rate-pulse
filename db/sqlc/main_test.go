package db

import (
	"context"
	"database/sql"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/ThanhVinhTong/rate-pulse/util"
	_ "github.com/lib/pq"
)

const (
	dbDriver       = "postgres"
	dbSource       = "postgresql://root:12345678@localhost:5432/rate_pulse?sslmode=disable"
	testDBSource   = "postgresql://root:12345678@localhost:5432/rate_pulse_test?sslmode=disable"
	postgresSource = "postgresql://root:12345678@localhost:5432/postgres?sslmode=disable"
)

var testQueries *Queries
var testDB *sql.DB

func TestMain(m *testing.M) {
	var err error

	// Step 1: Connect to postgres database to create test database
	postgresDB, err := sql.Open(dbDriver, postgresSource)
	if err != nil {
		log.Fatal("Cannot connect to postgres database: ", err)
	}
	defer postgresDB.Close()

	// Step 2: Create test database if it doesn't exist
	_, err = postgresDB.Exec("CREATE DATABASE rate_pulse_test")
	if err != nil {
		// Database might already exist, which is fine
		log.Printf("Note: Test database creation result: %v (this is OK if database already exists)", err)
	}

	// Step 3: Connect to test database
	testDB, err = sql.Open(dbDriver, testDBSource)
	if err != nil {
		log.Fatal("Cannot connect to test database: ", err)
	}
	defer testDB.Close()

	// Step 4: Drop existing tables if they exist (to handle re-runs)
	err = dropTables(testDB)
	if err != nil {
		log.Fatal("Cannot drop existing tables in test database: ", err)
	}

	// Step 5: Run migrations on test database
	err = runMigrations(testDB)
	if err != nil {
		log.Fatal("Cannot run migrations on test database: ", err)
	}

	// Step 6: Truncate tables to ensure clean state
	_, err = testDB.Exec(`
		TRUNCATE TABLE exchange_rates, rate_sources, currencies
		RESTART IDENTITY CASCADE
	`)
	if err != nil {
		log.Fatal("Cannot truncate test database tables: ", err)
	}

	testQueries = New(testDB)

	// Step 7: Ensure test data (currencies and rate sources) exist for all tests
	err = ensureTestData()
	if err != nil {
		log.Fatal("Cannot ensure test data exists: ", err)
	}

	os.Exit(m.Run())
}

func dropTables(db *sql.DB) error {
	// Drop tables in reverse order of dependencies to avoid foreign key constraints
	_, err := db.Exec(`
		DROP TABLE IF EXISTS exchange_rates CASCADE;
		DROP TABLE IF EXISTS rate_sources CASCADE;
		DROP TABLE IF EXISTS currencies CASCADE;
	`)
	return err
}

func runMigrations(db *sql.DB) error {
	// Get the path to the migration file relative to this test file
	// This file is in db/sqlc/, so we need to go up one level to db/migration/
	_, filename, _, _ := runtime.Caller(0)
	testDir := filepath.Dir(filename)
	migrationPath := filepath.Join(testDir, "..", "migration", "000001_init_schema.up.sql")

	// Read the migration file
	migrationSQL, err := os.ReadFile(migrationPath)
	if err != nil {
		return err
	}

	// Execute the migration
	_, err = db.Exec(string(migrationSQL))
	return err
}

// ensureTestData ensures that currencies and rate sources exist in the test database.
// This allows tests to run in any order without dependencies.
func ensureTestData() error {
	ctx := context.Background()

	// Check if currencies exist
	var currencyCount int
	err := testDB.QueryRow("SELECT COUNT(*) FROM currencies").Scan(&currencyCount)
	if err != nil {
		return err
	}

	// If no currencies exist, create them
	if currencyCount == 0 {
		currencies := util.GetAllCurrencies()
		for _, currency := range currencies {
			_, err := testQueries.CreateCurrency(ctx, CreateCurrencyParams{
				CurrencyCode:    currency["currency_code"].(string),
				CurrencyName:    currency["currency_name"].(string),
				CurrencyCountry: sql.NullString{String: currency["currency_country"].(string), Valid: true},
				CurrencySymbol:  sql.NullString{String: currency["currency_symbol"].(string), Valid: true},
			})
			if err != nil {
				return err
			}
		}
	}

	// Check if rate sources exist
	var sourceCount int
	err = testDB.QueryRow("SELECT COUNT(*) FROM rate_sources").Scan(&sourceCount)
	if err != nil {
		return err
	}

	// If no rate sources exist, create them
	if sourceCount == 0 {
		rateSources := util.GetAllRateSources()
		for _, source := range rateSources {
			_, err := testQueries.CreateRateSource(ctx, CreateRateSourceParams{
				SourceName:    source["source_name"].(string),
				SourceLink:    source["source_link"].(sql.NullString),
				SourceCountry: source["source_country"].(sql.NullString),
				SourceStatus:  source["source_status"].(sql.NullString),
			})
			if err != nil {
				return err
			}
		}
	}

	return nil
}
