package api

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// rateLimitMiddleware enforces rate limiting on all requests
// Uses IP address for public requests, user ID for authenticated requests
func (server *Server) rateLimitMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Determine the identifier: user ID if authenticated, otherwise IP
		var identifier string
		if payload, ok := authPayloadFromGinContext(ctx); ok {
			identifier = fmt.Sprintf("user:%d", payload.UserID)
		} else {
			identifier = ctx.ClientIP()
		}

		if identifier == "" {
			ctx.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Unable to identify client"})
			return
		}

		// Check rate limit
		allowed, remaining, resetTime := server.rateLimiter.Allow(ctx, identifier)

		// Add rate limit headers to response
		ctx.Header("X-RateLimit-Limit", strconv.Itoa(server.config.RateLimitPerMinute))
		ctx.Header("X-RateLimit-Remaining", strconv.Itoa(remaining))
		ctx.Header("X-RateLimit-Reset", strconv.FormatInt(resetTime, 10))

		if !allowed {
			retryAfter := resetTime - time.Now().Unix()
			if retryAfter < 1 {
				retryAfter = 1
			}
			ctx.Header("Retry-After", strconv.FormatInt(retryAfter, 10))
			ctx.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":   "rate limit exceeded",
				"message": fmt.Sprintf("Too many requests. Please retry after %d seconds.", retryAfter),
			})
			return
		}

		ctx.Next()
	}
}
