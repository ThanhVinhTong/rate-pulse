// Package util provides utility functions for the application
package util

import (
	"fmt"
	"time"
)

// Value safely dereferences a pointer of any type, returning the zero value if nil
func Value[T any](ptr *T) T {
	if ptr != nil {
		return *ptr
	}
	var zero T
	return zero
}

// ParseTimeRangeToDuration converts time range strings to durations.
// Supported formats: "24h", "7d", "2w", "1m", "6m", "1y", "2y", "5y", "10y", "all"
func ParseTimeRangeToDuration(timeRange string) (time.Duration, error) {
	durations := map[string]time.Duration{
		"24h": 1 * 24 * time.Hour,
		"48h": 2 * 24 * time.Hour,
		"7d":  7 * 24 * time.Hour,
		"15d": 15 * 24 * time.Hour,
		"30d": 30 * 24 * time.Hour,
		"2w":  14 * 24 * time.Hour,
		"1m":  30 * 24 * time.Hour,
		"6m":  180 * 24 * time.Hour,
		"1y":  365 * 24 * time.Hour,
		"2y":  730 * 24 * time.Hour,
		"5y":  1825 * 24 * time.Hour,
		"10y": 3650 * 24 * time.Hour,
		"all": 36500 * 24 * time.Hour,
	}

	duration, ok := durations[timeRange]
	if !ok {
		return 0, fmt.Errorf("invalid time_range: %s. Use format like '24h', '7d', '2w', '1m', '1y', 'all'", timeRange)
	}
	return duration, nil
}
