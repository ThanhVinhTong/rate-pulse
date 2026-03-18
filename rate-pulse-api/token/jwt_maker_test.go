package token

import (
	"fmt"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/require"
)

const MAX_LENGTH = 32

func TestJWTMaker(t *testing.T) {
	maker, err := NewJWTMaker(string(make([]byte, MAX_LENGTH)))
	if err != nil {
		t.Fatalf("Failed to create JWTMaker: %v", err)
	}

	username := string(make([]byte, MAX_LENGTH))
	duration := time.Minute

	issued_at := time.Now()
	expired_at := issued_at.Add(duration)

	token, err := maker.CreateToken(username, "user_type", duration)
	fmt.Println(token)
	require.NoError(t, err)
	require.NotEmpty(t, token)

	payload, err := maker.VerifyToken(token)
	fmt.Println(payload)
	require.NoError(t, err)
	require.NotEmpty(t, payload)

	require.NotZero(t, payload.ID)
	require.Equal(t, username, payload.Username)
	require.WithinDuration(t, issued_at, payload.IssuedAt, time.Second)
	require.WithinDuration(t, expired_at, payload.ExpiredAt, time.Second)
}

func TestExpiredToken(t *testing.T) {
	maker, err := NewJWTMaker(string(make([]byte, MAX_LENGTH)))
	if err != nil {
		t.Fatalf("Failed to create JWTMaker: %v", err)
	}

	username := string(make([]byte, MAX_LENGTH))
	duration := -time.Minute

	token, err := maker.CreateToken(username, "user_type", duration)
	require.NoError(t, err)
	require.NotEmpty(t, token)

	payload, err := maker.VerifyToken(token)
	require.Error(t, err)
	require.EqualError(t, err, ErrExpiredToken.Error())
	require.Nil(t, payload)
}

// to test for attacks like tampering with the token
func TestInvalidToken(t *testing.T) {
	payload, err := NewPayload(string(make([]byte, MAX_LENGTH)), "user_type", time.Minute)
	require.NoError(t, err)

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodNone, payload)
	token, err := jwtToken.SignedString(jwt.UnsafeAllowNoneSignatureType)
	require.NoError(t, err)

	maker, err := NewJWTMaker(string(make([]byte, MAX_LENGTH)))
	require.NoError(t, err)

	payload, err = maker.VerifyToken(token)
	require.Error(t, err)
	require.EqualError(t, err, ErrInvalidToken.Error())
	require.Nil(t, payload)
}
