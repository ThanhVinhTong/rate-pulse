package util

import "strings"

// normalizeEmail normalizes an email for consistent uniqueness checking.
// - Always lowercases and trims whitespace
// - Applies Gmail-specific rules (dots and +aliases are ignored)
// - For other providers, only does basic normalization
func NormalizeEmail(email string) string {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return ""
	}

	parts := strings.SplitN(email, "@", 2)
	if len(parts) != 2 {
		return email
	}

	local, domain := parts[0], parts[1]

	switch domain {
	case "gmail.com", "googlemail.com":
		// Gmail ignores dots and everything after +
		local = strings.ReplaceAll(local, ".", "")
		if idx := strings.Index(local, "+"); idx != -1 {
			local = local[:idx]
		}
		return local + "@gmail.com"

	case "outlook.com", "hotmail.com", "live.com":
		// Outlook treats dots as significant, but supports +alias
		if idx := strings.Index(local, "+"); idx != -1 {
			local = local[:idx]
		}
		return local + "@" + domain

	default:
		// For Yahoo and all other providers, only trim + lowercase
		return email
	}
}
