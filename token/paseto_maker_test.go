package token

import (
	"fmt"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/require"
)

const SYMMETRIC_KEY_LENGTH = 32

func TestPasetoMaker(t *testing.T) {
	maker, err := NewPasetoMaker(string(make([]byte, SYMMETRIC_KEY_LENGTH)))
	if err != nil {
		t.Fatalf("Failed to create PasetoMaker: %v", err)
	}

	username := string(make([]byte, SYMMETRIC_KEY_LENGTH))
	duration := time.Minute

	issued_at := time.Now()
	expired_at := issued_at.Add(duration)

	token, err := maker.CreateToken(username, duration)
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

func TestExpiredPasetoToken(t *testing.T) {
	maker, err := NewPasetoMaker(string(make([]byte, SYMMETRIC_KEY_LENGTH)))
	require.NoError(t, err)

	username := string(make([]byte, SYMMETRIC_KEY_LENGTH))
	duration := -time.Minute

	token, err := maker.CreateToken(username, duration)
	require.NoError(t, err)
	require.NotEmpty(t, token)

	payload, err := maker.VerifyToken(token)
	require.Error(t, err)
	require.EqualError(t, err, ErrExpiredToken.Error())
	require.Nil(t, payload)
}

// to test for attacks like tampering with the token
func TestInvalidPasetoToken(t *testing.T) {
	payload, err := NewPayload(string(make([]byte, SYMMETRIC_KEY_LENGTH)), time.Minute)
	require.NoError(t, err)

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodNone, payload)
	token, err := jwtToken.SignedString(jwt.UnsafeAllowNoneSignatureType)
	require.NoError(t, err)

	maker, err := NewPasetoMaker(string(make([]byte, SYMMETRIC_KEY_LENGTH)))
	require.NoError(t, err)

	payload, err = maker.VerifyToken(token)
	require.Error(t, err)
	require.EqualError(t, err, ErrInvalidToken.Error())
	require.Nil(t, payload)
}
