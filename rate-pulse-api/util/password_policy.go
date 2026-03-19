/*
2026 password policy aligned with:
- NIST SP 800-63B Revision 4
- Digital Identity Guidelines: Authentication and Authenticator Management
- Documentation: https://csrc.nist.gov/pubs/sp/800/63/b/4/final
*/

package util

import (
	"crypto/sha1"
	"encoding/hex"
	"errors"
	"io"
	"net/http"
	"strings"
)

const MinPasswordLength = 15

var ErrCommonPassword = errors.New("this password has previously appeared in data breaches – choose a different one")

var commonPasswords = map[string]struct{}{
	"password": {}, "password123": {}, "12345678": {}, "qwerty": {},
	"letmein": {}, "welcome": {}, "admin": {}, "monkey": {}, "abc123": {},
	"123456789": {}, "iloveyou": {}, "111111": {}, "123123": {},
	"password1": {}, "admin123": {}, "qwerty123": {}, "1234567890": {},
}

func isCommonPassword(password string) bool {
	_, ok := commonPasswords[strings.ToLower(password)]
	return ok
}

// ValidatePassword implements modern password validation rules.
// - Minimum length of 15 characters
// - Checks against known breached passwords via HIBP (k-anonymity)
// - No composition rules (no mandatory uppercase/digit/symbol)
func ValidatePassword(password string) error {
	if len(password) < MinPasswordLength {
		return errors.New("password must be at least 15 characters long")
	}

	// Always check local list first (fast + reliable)
	if isCommonPassword(password) {
		return ErrCommonPassword
	}

	// Then try HIBP as best-effort
	if pwned, err := isPwned(password); err == nil && pwned {
		return ErrCommonPassword
	}

	return nil
}

// isPwned checks if the password has been seen in breaches using
// Have I Been Pwned's k-anonymity API (only first 5 chars of SHA-1 are sent).
func isPwned(password string) (bool, error) {
	h := sha1.New()
	h.Write([]byte(password))
	hash := strings.ToUpper(hex.EncodeToString(h.Sum(nil)))

	prefix := hash[:5]
	resp, err := http.Get("https://api.pwnedpasswords.com/range/" + prefix)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false, errors.New("hibp service returned non-200 status")
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return false, err
	}

	suffix := hash[5:]
	for _, line := range strings.Split(string(body), "\n") {
		if strings.HasPrefix(strings.TrimSpace(line), suffix) {
			return true, nil
		}
	}
	return false, nil
}
