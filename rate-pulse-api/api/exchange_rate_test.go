package api

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/lib/pq"
	"github.com/stretchr/testify/require"
)

func newExchangeRateServerWithMockDB(t *testing.T) (*Server, sqlmock.Sqlmock, *sql.DB) {
	t.Helper()

	mockDB, mock, err := sqlmock.New()
	require.NoError(t, err)

	store := db.NewStore(mockDB)
	server := newTestServer(t, store)
	return server, mock, mockDB
}

func mustJSON(t *testing.T, v any) *bytes.Reader {
	t.Helper()
	b, err := json.Marshal(v)
	require.NoError(t, err)
	return bytes.NewReader(b)
}

func TestGetExchangeRate_HappyPath(t *testing.T) {
	server, mock, mockDB := newExchangeRateServerWithMockDB(t)
	defer mockDB.Close()

	rows := sqlmock.NewRows([]string{
		"rate_id", "rate_value", "source_currency_id", "destination_currency_id",
		"valid_from_date", "valid_to_date", "source_id", "type_id", "created_at", "updated_at",
	}).AddRow(
		1, "17695.08", 1, 2, time.Now(), sql.NullTime{}, sql.NullInt32{Int32: 10, Valid: true},
		sql.NullInt32{Int32: 3, Valid: true}, sql.NullTime{}, sql.NullTime{},
	)

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT rate_id, rate_value`)).
		WithArgs(int32(1)).
		WillReturnRows(rows)

	req := httptest.NewRequest(http.MethodGet, "/exchange-rates/1", nil)
	addAuthorization(
		t,
		req,
		server.tokenMaker,
		authorizationTypeBearer,
		1,                  // userID
		"test@example.com", // email
		"testuser",         // username
		"free",             // userType
		time.Minute,
	)
	w := httptest.NewRecorder()
	server.router.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestCreateExchangeRate_ValidationErrors(t *testing.T) {
	server, _, mockDB := newExchangeRateServerWithMockDB(t)
	defer mockDB.Close()

	tests := []struct {
		name string
		body map[string]any
	}{
		{
			name: "missing_required_fields",
			body: map[string]any{"rate_value": "1.23"},
		},
		{
			name: "invalid_type",
			body: map[string]any{
				"rate_value": "1.23", "source_currency_id": 1, "destination_currency_id": 2,
				"valid_from_date": "2026-03-27T10:00:00Z", "type": 999,
			},
		},
		{
			name: "malformed_json_type",
			body: map[string]any{
				"rate_value": true, "source_currency_id": 1, "destination_currency_id": 2,
				"valid_from_date": "2026-03-27T10:00:00Z",
			},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/admin/exchange-rates", mustJSON(t, tc.body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			addAuthorization(
				t,
				req,
				server.tokenMaker,
				authorizationTypeBearer,
				1,
				"admin@example.com",
				"adminuser",
				"admin", // must be admin for /admin routes
				time.Minute,
			)
			server.router.ServeHTTP(w, req)
			require.Equal(t, http.StatusBadRequest, w.Code)
		})
	}
}

func TestGetExchangeRate_NotFound(t *testing.T) {
	server, mock, mockDB := newExchangeRateServerWithMockDB(t)
	defer mockDB.Close()

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT rate_id, rate_value`)).
		WithArgs(int32(999)).
		WillReturnError(sql.ErrNoRows)

	req := httptest.NewRequest(http.MethodGet, "/exchange-rates/999", nil)
	addAuthorization(
		t,
		req,
		server.tokenMaker,
		authorizationTypeBearer,
		1,
		"admin@example.com",
		"adminuser",
		"admin",
		time.Minute,
	)
	w := httptest.NewRecorder()
	server.router.ServeHTTP(w, req)

	// after handler fix:
	require.Equal(t, http.StatusNotFound, w.Code)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestListExchangeRate_DBError(t *testing.T) {
	server, mock, mockDB := newExchangeRateServerWithMockDB(t)
	defer mockDB.Close()

	mock.ExpectQuery(regexp.QuoteMeta(`FROM exchange_rates`)).
		WithArgs(int32(0), int32(20)).
		WillReturnError(errors.New("db down"))

	req := httptest.NewRequest(http.MethodGet, "/exchange-rates?last_rate_id=0&limit=20", nil)
	addAuthorization(
		t,
		req,
		server.tokenMaker,
		authorizationTypeBearer,
		1,
		"admin@example.com",
		"adminuser",
		"admin",
		time.Minute,
	)
	w := httptest.NewRecorder()
	server.router.ServeHTTP(w, req)

	require.Equal(t, http.StatusInternalServerError, w.Code)
	require.NoError(t, mock.ExpectationsWereMet())
}

func TestListExchangeRate_CursorCases(t *testing.T) {
	server, mock, mockDB := newExchangeRateServerWithMockDB(t)
	defer mockDB.Close()

	t.Run("first_page_last_rate_id_0", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{
			"rate_id", "rate_value", "source_currency_id", "destination_currency_id",
			"valid_from_date", "valid_to_date", "source_id", "type_id", "created_at", "updated_at",
		})
		mock.ExpectQuery(regexp.QuoteMeta(`WHERE rate_id > $1`)).
			WithArgs(int32(0), int32(20)).
			WillReturnRows(rows)

		req := httptest.NewRequest(http.MethodGet, "/exchange-rates?last_rate_id=0&limit=20", nil)
		addAuthorization(
			t,
			req,
			server.tokenMaker,
			authorizationTypeBearer,
			1,
			"admin@example.com",
			"adminuser",
			"admin",
			time.Minute,
		)
		w := httptest.NewRecorder()
		server.router.ServeHTTP(w, req)
		require.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("invalid_cursor_negative", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/exchange-rates?last_rate_id=-1&limit=20", nil)
		addAuthorization(
			t,
			req,
			server.tokenMaker,
			authorizationTypeBearer,
			1,
			"admin@example.com",
			"adminuser",
			"admin",
			time.Minute,
		)
		w := httptest.NewRecorder()
		server.router.ServeHTTP(w, req)
		require.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestCreateExchangeRate_BusinessRule_DuplicateSameRecord(t *testing.T) {
	server, mock, mockDB := newExchangeRateServerWithMockDB(t)
	defer mockDB.Close()

	body := map[string]any{
		"rate_value":              "17695.08",
		"source_currency_id":      1,
		"destination_currency_id": 2,
		"valid_from_date":         "2026-03-27T10:00:00Z",
		"source_id":               10,
		"type":                    1,
	}

	// 1) first insert succeeds
	firstRows := sqlmock.NewRows([]string{
		"rate_id", "rate_value", "source_currency_id", "destination_currency_id",
		"valid_from_date", "valid_to_date", "source_id", "updated_at", "created_at", "type_id",
	}).AddRow(
		1, "17695.08", 1, 2, time.Now(), sql.NullTime{},
		sql.NullInt32{Int32: 10, Valid: true}, sql.NullTime{}, sql.NullTime{},
		sql.NullInt32{Int32: 1, Valid: true},
	)

	mock.ExpectQuery(regexp.QuoteMeta(`INSERT INTO exchange_rates`)).
		WillReturnRows(firstRows)

	// 2) second insert (same payload) => duplicate
	mock.ExpectQuery(regexp.QuoteMeta(`INSERT INTO exchange_rates`)).
		WillReturnError(&pq.Error{Code: "23505", Message: "duplicate key value violates unique constraint"})

	// request #1
	req1 := httptest.NewRequest(http.MethodPost, "/admin/exchange-rates", mustJSON(t, body))
	req1.Header.Set("Content-Type", "application/json")
	addAuthorization(t, req1, server.tokenMaker, authorizationTypeBearer, 1, "admin@example.com", "adminuser", "admin", time.Minute)

	w1 := httptest.NewRecorder()
	server.router.ServeHTTP(w1, req1)
	require.Equal(t, http.StatusOK, w1.Code)

	// request #2 (same record)
	req2 := httptest.NewRequest(http.MethodPost, "/admin/exchange-rates", mustJSON(t, body))
	req2.Header.Set("Content-Type", "application/json")
	addAuthorization(t, req2, server.tokenMaker, authorizationTypeBearer, 1, "admin@example.com", "adminuser", "admin", time.Minute)

	w2 := httptest.NewRecorder()
	server.router.ServeHTTP(w2, req2)
	require.Equal(t, http.StatusConflict, w2.Code)

	require.NoError(t, mock.ExpectationsWereMet())
}

func TestCreateExchangeRate_Unauthorized(t *testing.T) {
	server, _, mockDB := newExchangeRateServerWithMockDB(t)
	defer mockDB.Close()

	body := map[string]any{
		"rate_value":              "1.2345",
		"source_currency_id":      1,
		"destination_currency_id": 2,
		"valid_from_date":         "2026-03-27T10:00:00Z",
		"type":                    1,
	}

	req := httptest.NewRequest(http.MethodPost, "/admin/exchange-rates", mustJSON(t, body))
	req.Header.Set("Content-Type", "application/json")
	// no token
	w := httptest.NewRecorder()
	server.router.ServeHTTP(w, req)

	require.Equal(t, http.StatusUnauthorized, w.Code)
}
