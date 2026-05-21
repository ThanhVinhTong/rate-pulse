package api

import (
	"net/http"
	"time"

	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
)

const (
	requestIDHeaderKey  = "x-request-id"
	requestIDContextKey = "request_id"
)

func requestIDMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		requestID := ctx.GetHeader(requestIDHeaderKey)
		if requestID == "" {
			requestID = uuid.NewString()
		}

		ctx.Set(requestIDContextKey, requestID)
		ctx.Header(requestIDHeaderKey, requestID)
		ctx.Next()
	}
}

func ginLogger() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		start := time.Now()
		ctx.Next()

		statusCode := ctx.Writer.Status()
		path := ctx.FullPath()
		if path == "" {
			path = ctx.Request.URL.Path
		}

		event := log.Info()
		if len(ctx.Errors) > 0 || statusCode >= http.StatusInternalServerError {
			event = log.Error()
		}

		if len(ctx.Errors) > 0 {
			event = event.Str("error", ctx.Errors.String())
		}

		event = event.
			Str("method", ctx.Request.Method).
			Str("path", path).
			Str("request_id", requestIDFromGinContext(ctx)).
			Int("status_code", statusCode).
			Int64("latency_ms", time.Since(start).Milliseconds()).
			Str("client_ip", ctx.ClientIP())

		if payload, ok := authPayloadFromGinContext(ctx); ok {
			event = event.Int32("user_id", payload.UserID)
		}

		event.Msg("http request completed")
	}
}

func requestIDFromGinContext(ctx *gin.Context) string {
	requestID, _ := ctx.Get(requestIDContextKey)
	value, _ := requestID.(string)
	return value
}

func authPayloadFromGinContext(ctx *gin.Context) (*token.Payload, bool) {
	payload, ok := ctx.Get(authorizationPayloadKey)
	if !ok {
		return nil, false
	}

	authPayload, ok := payload.(*token.Payload)
	return authPayload, ok
}
