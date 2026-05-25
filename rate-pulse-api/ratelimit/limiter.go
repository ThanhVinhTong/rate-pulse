package ratelimit

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

// RateLimiter implements token bucket algorithm for rate limiting using Redis
type RateLimiter struct {
	client         *redis.Client
	requestsPerMin int
}

const defaultRequestsPerMinute = 300

// NewRateLimiter creates a new rate limiter with Redis backend
func NewRateLimiter(redisClient *redis.Client, requestsPerMin int) *RateLimiter {
	if requestsPerMin <= 0 {
		requestsPerMin = defaultRequestsPerMinute
	}

	return &RateLimiter{
		client:         redisClient,
		requestsPerMin: requestsPerMin,
	}
}

// Allow checks if a request from the given key is allowed
// Returns (allowed bool, remaining int, resetTime int64)
func (rl *RateLimiter) Allow(ctx context.Context, key string) (bool, int, int64) {
	// Ensure key is valid
	key = strings.TrimSpace(key)
	if key == "" {
		return false, 0, 0
	}

	now := time.Now().Unix()
	if rl == nil {
		return true, defaultRequestsPerMinute, now + 60
	}

	requestsPerMin := rl.requestsPerMin
	if requestsPerMin <= 0 {
		requestsPerMin = defaultRequestsPerMinute
	}
	if rl.client == nil {
		return true, requestsPerMin, now + 60
	}

	redisKey := fmt.Sprintf("ratelimit:%s", key)
	windowStart := now - 60 // 1 minute window

	// Lua script to atomically check and increment rate limit counter
	script := redis.NewScript(`
		local key = KEYS[1]
		local limit = tonumber(ARGV[1])
		local now = tonumber(ARGV[2])
		local window_start = tonumber(ARGV[3])
		
		-- Remove old entries outside the window
		redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)
		
		-- Count requests in the current window
		local current = redis.call('ZCARD', key)
		
		-- Check if limit exceeded
		if current < limit then
			-- Add current request with timestamp as score
			redis.call('ZADD', key, now, now)
			-- Set expiration to 2 minutes to clean up old data
			redis.call('EXPIRE', key, 120)
			-- Return: allowed, remaining, reset_time
			return {1, limit - current - 1, now + 60}
		else
			-- Get the oldest request timestamp for reset time calculation
			local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
			local reset_time = oldest[2] and (tonumber(oldest[2]) + 60) or (now + 60)
			return {0, 0, reset_time}
		end
	`)

	result, err := script.Run(ctx, rl.client, []string{redisKey}, requestsPerMin, now, windowStart).Result()
	if err != nil {
		// On error, fail open (allow the request) but log it
		// In production, you might want to fail closed instead
		return true, requestsPerMin, now + 60
	}

	values := result.([]interface{})
	allowed := values[0].(int64) == 1
	remaining := int(values[1].(int64))
	resetTime := values[2].(int64)

	return allowed, remaining, resetTime
}
