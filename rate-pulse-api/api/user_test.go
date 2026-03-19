package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/stretchr/testify/require"
)

func TestCreateUser(t *testing.T) {
	tests := []struct {
		name         string
		payload      map[string]any
		expectedCode int
	}{
		{
			name: "missing username",
			payload: map[string]any{
				"email":    "test@example.com",
				"password": "StrongPass123!xyz",
			},
			expectedCode: http.StatusBadRequest,
		},
		{
			name: "invalid email",
			payload: map[string]any{
				"username": "testuser",
				"email":    "not-an-email",
				"password": "StrongPass123!xyz",
			},
			expectedCode: http.StatusBadRequest,
		},
		{
			name: "weak password",
			payload: map[string]any{
				"username": "testuser",
				"email":    "test@example.com",
				"password": "123",
			},
			expectedCode: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := newTestServer(t, &db.Store{})

			body, _ := json.Marshal(tt.payload)
			req := httptest.NewRequest(http.MethodPost, "/users/signup", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			server.router.ServeHTTP(w, req)

			require.Equal(t, tt.expectedCode, w.Code, "Wrong status code for test: "+tt.name)
		})
	}
}

func TestLoginUser(t *testing.T) {
	tests := []struct {
		name         string
		payload      map[string]any
		expectedCode int
		description  string
	}{
		{
			name:         "missing_email",
			payload:      map[string]any{"password": "StrongPass123!xyz"},
			expectedCode: http.StatusBadRequest,
			description:  "should fail when email is missing",
		},
		{
			name:         "missing_password",
			payload:      map[string]any{"email": "test@example.com"},
			expectedCode: http.StatusBadRequest,
			description:  "should fail when password is missing",
		},
		{
			name:         "empty_email",
			payload:      map[string]any{"email": "", "password": "StrongPass123!xyz"},
			expectedCode: http.StatusBadRequest,
			description:  "should fail when email is empty",
		},
		{
			name:         "empty_password",
			payload:      map[string]any{"email": "test@example.com", "password": ""},
			expectedCode: http.StatusBadRequest,
			description:  "should fail when password is empty",
		},
		{
			name:         "invalid_email_format",
			payload:      map[string]any{"email": "not-an-email", "password": "StrongPass123!xyz"},
			expectedCode: http.StatusBadRequest,
			description:  "should fail on invalid email format",
		},
		{
			name:         "email_with_whitespace",
			payload:      map[string]any{"email": "  test@example.com  ", "password": "StrongPass123!xyz"},
			expectedCode: http.StatusBadRequest,
			description:  "whitespace should be trimmed by normalizeEmail",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := newTestServer(t, &db.Store{})
			body, _ := json.Marshal(tt.payload)
			req := httptest.NewRequest(http.MethodPost, "/users/signin", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			server.router.ServeHTTP(w, req)
			require.Equal(t, tt.expectedCode, w.Code, tt.description)
		})
	}
}
