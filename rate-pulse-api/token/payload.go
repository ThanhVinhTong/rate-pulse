package token

import (
	"errors"
	"fmt"
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
	UserID    int32     `json:"user_id"`  // primary identity
	Username  string    `json:"username"` // display only
	Email     string    `json:"email"`    // optional display
	UserType  string    `json:"user_type"`
	IssuedAt  time.Time `json:"issued_at"`
	ExpiredAt time.Time `json:"expired_at"`
}

// NewPayload creates a new payload for a given username, userType and duration.
func NewPayload(userID int32, username, email, userType string, duration time.Duration) (*Payload, error) {
	tokenID, err := uuid.NewRandom()
	if err != nil {
		return nil, err
	}

	payload := &Payload{
		ID:        tokenID,
		UserID:    userID,
		Email:     email,
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
	return fmt.Sprintf("%d", payload.UserID), nil // better to use stable ID
}

// GetAudience implements jwt.Claims interface
func (payload *Payload) GetAudience() (jwt.ClaimStrings, error) {
	return nil, nil
}
