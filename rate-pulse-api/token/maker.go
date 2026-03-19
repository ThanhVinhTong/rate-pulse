/*
This package is responsible for creating and verifying JSON Web Tokens (JWTs).
*/

package token

import "time"

// Maker is the interface for creating and verifying JWT tokens.
type Maker interface {
	// CreateToken creates a new token for a given userID, username, email, userType and duration.
	CreateToken(userID int32, username, email, userType string, duration time.Duration) (string, *Payload, error)

	// VerifyToken verifies a token and returns the payload if it is valid.
	VerifyToken(token string) (*Payload, error)
}
