package worker

import (
	"net/url"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestBuildVerifyEmailURL(t *testing.T) {
	verifyURL := buildVerifyEmailURL("https://rate-pulse.me/verify_email?", 42, "secret code+/")

	parsedURL, err := url.Parse(verifyURL)
	require.NoError(t, err)
	require.Equal(t, "https", parsedURL.Scheme)
	require.Equal(t, "rate-pulse.me", parsedURL.Host)
	require.Equal(t, "/verify_email", parsedURL.Path)
	require.Equal(t, "42", parsedURL.Query().Get("email_id"))
	require.Equal(t, "secret code+/", parsedURL.Query().Get("secret_code"))
}

func TestBuildVerifyEmailURLUsesProductionFallback(t *testing.T) {
	verifyURL := buildVerifyEmailURL("", 42, "secret")

	require.Equal(t, "https://rate-pulse.me/verify_email?email_id=42&secret_code=secret", verifyURL)
}

func TestNewVerifyEmailSecret(t *testing.T) {
	secret, err := newVerifyEmailSecret()

	require.NoError(t, err)
	require.NotEmpty(t, secret)
	require.Len(t, secret, 43)
	require.NotContains(t, secret, "+")
	require.NotContains(t, secret, "/")
	require.NotContains(t, secret, "=")
}
