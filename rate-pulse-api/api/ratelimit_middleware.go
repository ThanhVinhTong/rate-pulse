package api

import (
	"fmt"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// rateLimitMiddleware enforces rate limiting on all requests
// Uses IP address for public requests, user ID for authenticated requests
func (server *Server) rateLimitMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Determine the identifier: user ID if authenticated, otherwise IP
		var identifier string
		if userID, exists := ctx.Get("user_id"); exists {
			identifier = fmt.Sprintf("user:%v", userID)
		} else {
			identifier = getClientIP(ctx)
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

// getClientIP extracts the real client IP address
// Handles X-Forwarded-For, X-Real-IP headers for proxied requests
func getClientIP(ctx *gin.Context) string {
	// Check X-Forwarded-For header (multiple proxies)
	if xff := ctx.GetHeader("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		if ip := strings.TrimSpace(ips[0]); ip != "" {
			return ip
		}
	}

	// Check X-Real-IP header
	if xri := ctx.GetHeader("X-Real-IP"); xri != "" {
		return xri
	}

	// Fall back to RemoteAddr
	ip, _, err := net.SplitHostPort(ctx.Request.RemoteAddr)
	if err != nil {
		return ctx.Request.RemoteAddr
	}
	return ip
}
