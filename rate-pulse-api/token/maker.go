/*
This package is responsible for creating and verifying JSON Web Tokens (JWTs).
*/

package token

import "time"

// Maker is the interface for creating and verifying JWT tokens.
type Maker interface {
	// CreateToken creates a new token for a given username, userType and duration.
	CreateToken(username string, userType string, duration time.Duration) (string, error)

	// VerifyToken verifies a token and returns the payload if it is valid.
	VerifyToken(token string) (*Payload, error)
}
