package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/stretchr/testify/require"
)

func makeJSONRequest(t *testing.T, method, path string, payload map[string]any) *http.Request {
	t.Helper()

	body, err := json.Marshal(payload)
	require.NoError(t, err)

	req := httptest.NewRequest(method, path, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	return req
}

func serveRequest(server *Server, req *http.Request) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	server.router.ServeHTTP(w, req)
	return w
}

func TestCreateUserValidation(t *testing.T) {
	tests := []struct {
		name         string
		payload      map[string]any
		expectedCode int
	}{
		{
			name: "missing username",
			payload: map[string]any{
				"email":      "test@example.com",
				"password":   "StrongPass123!xyz",
				"first_name": "Test",
				"last_name":  "User",
			},
			expectedCode: http.StatusBadRequest,
		},
		{
			name: "missing first name",
			payload: map[string]any{
				"username":  "testuser",
				"email":     "test@example.com",
				"password":  "StrongPass123!xyz",
				"last_name": "User",
			},
			expectedCode: http.StatusBadRequest,
		},
		{
			name: "invalid email",
			payload: map[string]any{
				"username":   "testuser",
				"email":      "not-an-email",
				"password":   "StrongPass123!xyz",
				"first_name": "Test",
				"last_name":  "User",
			},
			expectedCode: http.StatusBadRequest,
		},
		{
			name: "weak password",
			payload: map[string]any{
				"username":   "testuser",
				"email":      "test@example.com",
				"password":   "123",
				"first_name": "Test",
				"last_name":  "User",
			},
			expectedCode: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := newTestServer(t, db.NewStore(nil))
			req := makeJSONRequest(t, http.MethodPost, "/users/signup", tt.payload)
			w := serveRequest(server, req)

			require.Equal(t, tt.expectedCode, w.Code)
		})
	}
}

func TestCreateUserValidationResponse(t *testing.T) {
	server := newTestServer(t, db.NewStore(nil))
	req := makeJSONRequest(t, http.MethodPost, "/users/signup", map[string]any{
		"email":      "not-an-email",
		"password":   "StrongPass123!xyz",
		"first_name": "Test",
		"last_name":  "User",
	})

	w := serveRequest(server, req)

	require.Equal(t, http.StatusBadRequest, w.Code)

	var body struct {
		Code    string `json:"code"`
		Message string `json:"message"`
		Fields  []struct {
			Field  string `json:"field"`
			Reason string `json:"reason"`
		} `json:"fields"`
	}
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &body))
	require.Equal(t, "INVALID_INPUT", body.Code)
	require.Equal(t, "invalid request parameters", body.Message)
	require.NotEmpty(t, body.Fields)
	require.Equal(t, "username", body.Fields[0].Field)
	require.Equal(t, "username is required", body.Fields[0].Reason)
}

func TestLoginUserValidation(t *testing.T) {
	tests := []struct {
		name         string
		payload      map[string]any
		expectedCode int
	}{
		{
			name:         "missing email",
			payload:      map[string]any{"password": "StrongPass123!xyz"},
			expectedCode: http.StatusBadRequest,
		},
		{
			name:         "missing password",
			payload:      map[string]any{"email": "test@example.com"},
			expectedCode: http.StatusBadRequest,
		},
		{
			name:         "empty email",
			payload:      map[string]any{"email": "", "password": "StrongPass123!xyz"},
			expectedCode: http.StatusBadRequest,
		},
		{
			name:         "empty password",
			payload:      map[string]any{"email": "test@example.com", "password": ""},
			expectedCode: http.StatusBadRequest,
		},
		{
			name:         "invalid email format",
			payload:      map[string]any{"email": "not-an-email", "password": "StrongPass123!xyz"},
			expectedCode: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := newTestServer(t, db.NewStore(nil))
			req := makeJSONRequest(t, http.MethodPost, "/users/signin", tt.payload)
			w := serveRequest(server, req)

			require.Equal(t, tt.expectedCode, w.Code)
		})
	}
}

func TestLogoutUserValidation(t *testing.T) {
	server := newTestServer(t, db.NewStore(nil))

	req := makeJSONRequest(t, http.MethodPost, "/users/signout", map[string]any{})
	w := serveRequest(server, req)

	require.Equal(t, http.StatusBadRequest, w.Code)
}

func TestVerifyEmailValidation(t *testing.T) {
	tests := []struct {
		name    string
		payload map[string]any
	}{
		{
			name:    "missing email id",
			payload: map[string]any{"secret_code": "secret"},
		},
		{
			name:    "missing secret code",
			payload: map[string]any{"email_id": 42},
		},
		{
			name:    "invalid email id",
			payload: map[string]any{"email_id": 0, "secret_code": "secret"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := newTestServer(t, db.NewStore(nil))
			req := makeJSONRequest(t, http.MethodPost, "/users/verify-email", tt.payload)
			w := serveRequest(server, req)

			require.Equal(t, http.StatusBadRequest, w.Code)
		})
	}
}

func TestProtectedUserRoutesRequireAuth(t *testing.T) {
	tests := []struct {
		name   string
		method string
		path   string
		body   map[string]any
	}{
		{"get user", http.MethodGet, "/users/1", nil},
		{"list users", http.MethodGet, "/users?page_id=1&page_size=5", nil},
		{"update user", http.MethodPut, "/users/1", map[string]any{"first_name": "Test"}},
		{"admin update user", http.MethodPut, "/admin/users/1", map[string]any{"user_type": "admin"}},
		{"delete user", http.MethodDelete, "/admin/users/1", nil},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := newTestServer(t, db.NewStore(nil))

			var req *http.Request
			if tt.body != nil {
				req = makeJSONRequest(t, tt.method, tt.path, tt.body)
			} else {
				req = httptest.NewRequest(tt.method, tt.path, nil)
			}

			w := serveRequest(server, req)

			require.Equal(t, http.StatusUnauthorized, w.Code)
		})
	}
}

func TestAdminUserRoutesRequireAdmin(t *testing.T) {
	tests := []struct {
		name   string
		method string
		path   string
		body   map[string]any
	}{
		{"admin update user", http.MethodPut, "/admin/users/1", map[string]any{"user_type": "admin"}},
		{"delete user", http.MethodDelete, "/admin/users/1", nil},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := newTestServer(t, db.NewStore(nil))

			var req *http.Request
			if tt.body != nil {
				req = makeJSONRequest(t, tt.method, tt.path, tt.body)
			} else {
				req = httptest.NewRequest(tt.method, tt.path, nil)
			}

			addAuthorization(
				t,
				req,
				server.tokenMaker,
				authorizationTypeBearer,
				1,
				"user@example.com",
				"testuser",
				UserTypeFree,
				time.Minute,
			)

			w := serveRequest(server, req)

			require.Equal(t, http.StatusUnauthorized, w.Code)
		})
	}
}

func TestListUsersBinding(t *testing.T) {
	server := newTestServer(t, db.NewStore(nil))

	req := httptest.NewRequest(http.MethodGet, "/users?page_id=0&page_size=5", nil)
	addAuthorization(
		t,
		req,
		server.tokenMaker,
		authorizationTypeBearer,
		1,
		"user@example.com",
		"testuser",
		UserTypeFree,
		time.Minute,
	)

	w := serveRequest(server, req)

	require.Equal(t, http.StatusBadRequest, w.Code)
}

func TestUpdateUserBinding(t *testing.T) {
	server := newTestServer(t, db.NewStore(nil))

	req := makeJSONRequest(t, http.MethodPut, "/users/0", map[string]any{
		"first_name": "Test",
	})
	addAuthorization(
		t,
		req,
		server.tokenMaker,
		authorizationTypeBearer,
		1,
		"user@example.com",
		"testuser",
		UserTypeFree,
		time.Minute,
	)

	w := serveRequest(server, req)

	require.Equal(t, http.StatusBadRequest, w.Code)
}
