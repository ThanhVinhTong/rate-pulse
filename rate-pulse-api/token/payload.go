package token

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	ErrExpiredToken = errors.New("token has expired")
	ErrInvalidToken = errors.New("token is invalid")
)

// Payload contains the payload data of the JWT.
// Implements jwt.Claims interface for golang-jwt/jwt/v5
type Payload struct {
	ID        uuid.UUID `json:"id"`
	Username  string    `json:"username"`
	UserType  string    `json:"user_type"`
	IssuedAt  time.Time `json:"issued_at"`
	ExpiredAt time.Time `json:"expired_at"`
}

// NewPayload creates a new payload for a given username, userType and duration.
func NewPayload(username string, userType string, duration time.Duration) (*Payload, error) {
	tokenID, err := uuid.NewRandom()
	if err != nil {
		return nil, err
	}

	payload := &Payload{
		ID:        tokenID,
		Username:  username,
		UserType:  userType,
		IssuedAt:  time.Now(),
		ExpiredAt: time.Now().Add(duration),
	}

	return payload, nil
}

// Valid checks if the token payload is valid (not expired)
func (payload *Payload) Valid() error {
	if time.Now().After(payload.ExpiredAt) {
		return ErrExpiredToken
	}
	return nil
}

// GetExpirationTime implements jwt.Claims interface
func (payload *Payload) GetExpirationTime() (*jwt.NumericDate, error) {
	return jwt.NewNumericDate(payload.ExpiredAt), nil
}

// GetIssuedAt implements jwt.Claims interface
func (payload *Payload) GetIssuedAt() (*jwt.NumericDate, error) {
	return jwt.NewNumericDate(payload.IssuedAt), nil
}

// GetNotBefore implements jwt.Claims interface
func (payload *Payload) GetNotBefore() (*jwt.NumericDate, error) {
	return jwt.NewNumericDate(payload.IssuedAt), nil
}

// GetIssuer implements jwt.Claims interface
func (payload *Payload) GetIssuer() (string, error) {
	return "", nil
}

// GetSubject implements jwt.Claims interface
func (payload *Payload) GetSubject() (string, error) {
	return payload.Username, nil
}

// GetAudience implements jwt.Claims interface
func (payload *Payload) GetAudience() (jwt.ClaimStrings, error) {
	return nil, nil
}
