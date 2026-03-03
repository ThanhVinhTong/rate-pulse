// Package util provides utility functions for the application
package util

// Value safely dereferences a pointer of any type, returning the zero value if nil
func Value[T any](ptr *T) T {
	if ptr != nil {
		return *ptr
	}
	var zero T
	return zero
}
