package service

import "errors"

// Error represents a service layer error with rich context.
type Error struct {
	Code    string // Machine-readable error code
	Message string // Human-readable message
	Err     error  // Underlying error (for wrapping)
}

var (
	// Input / Validation errors (4xx)
	ErrInvalidInput = NewError("INVALID_INPUT", "invalid input") // 400

	// Authentication / Authorization (4xx)
	ErrInvalidCredentials = NewError("INVALID_CREDENTIALS", "invalid email or password") // 401
	ErrUnauthorized       = NewError("UNAUTHORIZED", "unauthorized")                     // 401
	ErrInactiveUser       = NewError("INACTIVE_USER", "user is inactive")                // 401
	ErrSessionNotFound    = NewError("SESSION_NOT_FOUND", "session not found")           // 401
	ErrSessionBlocked     = NewError("SESSION_BLOCKED", "session is blocked")            // 401
	ErrSessionExpired     = NewError("SESSION_EXPIRED", "session expired")               // 401

	// Conflict errors (4xx)
	ErrDuplicateEmail = NewError("DUPLICATE_EMAIL", "email already exists") // 409

	// Server errors (5xx)
	ErrInternal = NewError("INTERNAL_SERVER_ERROR", "internal server error") // 500
)

// NewError creates a new service error
func NewError(code, message string) Error {
	return Error{
		Code:    code,
		Message: message,
	}
}

// Wrap wraps an underlying error
func Wrap(err error, code, message string) Error {
	return Error{
		Code:    code,
		Message: message,
		Err:     err,
	}
}

// Error implements the error interface
func (e Error) Error() string {
	if e.Message != "" {
		return e.Message
	}
	if e.Err != nil {
		return e.Err.Error()
	}
	return "internal server error"
}

func (e Error) Unwrap() error {
	return e.Err
}

// Helper functions
func IsServiceError(err error) bool {
	var serviceErr Error
	return errors.As(err, &serviceErr)
}

func ServiceErrorCode(err error) string {
	var serviceErr Error
	if errors.As(err, &serviceErr) {
		return serviceErr.Code
	}
	return "INTERNAL_SERVER_ERROR"
}

func ServiceErrorMessage(err error) string {
	var serviceErr Error
	if errors.As(err, &serviceErr) {
		return serviceErr.Message
	}
	return "internal server error"
}
