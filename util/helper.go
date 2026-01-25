// Package util provides utility functions for the application
package util

// StrValue safely dereferences a string pointer, returning empty string if nil
func StrValue(s *string) string {
	if s != nil {
		return *s
	}
	return ""
}

// BoolValue safely dereferences a bool pointer, returning false if nil
func BoolValue(b *bool) bool {
	if b != nil {
		return *b
	}
	return false
}
