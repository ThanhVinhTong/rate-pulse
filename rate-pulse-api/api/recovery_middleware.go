package api

import (
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

func ginRecovery() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		defer func() {
			if recovered := recover(); recovered != nil {
				log.Error().
					Str("method", ctx.Request.Method).
					Str("path", ctx.Request.URL.Path).
					Str("request_id", requestIDFromGinContext(ctx)).
					Interface("panic", recovered).
					Bytes("stack", debug.Stack()).
					Msg("http panic recovered")

				ctx.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"code":    "INTERNAL",
					"message": "internal server error",
				})
			}
		}()

		ctx.Next()
	}
}
