package ratelimit

import (
	"context"
	"testing"
	"time"
)

func TestAllowFailsOpenWithoutRedisClient(t *testing.T) {
	limiter := NewRateLimiter(nil, 42)

	allowed, remaining, resetTime := limiter.Allow(context.Background(), "127.0.0.1")

	if !allowed {
		t.Fatal("expected request to be allowed without Redis client")
	}
	if remaining != 42 {
		t.Fatalf("remaining = %d, want 42", remaining)
	}
	if resetTime <= time.Now().Unix() {
		t.Fatalf("resetTime = %d, want a future unix timestamp", resetTime)
	}
}

func TestNewRateLimiterDefaultsLimit(t *testing.T) {
	limiter := NewRateLimiter(nil, 0)

	_, remaining, _ := limiter.Allow(context.Background(), "127.0.0.1")

	if remaining != defaultRequestsPerMinute {
		t.Fatalf("remaining = %d, want %d", remaining, defaultRequestsPerMinute)
	}
}
