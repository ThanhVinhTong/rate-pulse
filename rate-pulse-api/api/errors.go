package api

import (
	"net/http"

	"github.com/ThanhVinhTong/rate-pulse/service"
	"github.com/gin-gonic/gin"
)

func RespondServiceError(ctx *gin.Context, err error) {
	switch service.ServiceErrorCode(err) {
	case service.ErrInvalidInput.Code:
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
	case service.ErrInvalidCredentials.Code,
		service.ErrUnauthorized.Code,
		service.ErrSessionNotFound.Code,
		service.ErrSessionBlocked.Code,
		service.ErrSessionExpired.Code:
		ctx.JSON(http.StatusUnauthorized, errorResponse(err))
	case service.ErrDuplicateEmail.Code:
		ctx.JSON(http.StatusConflict, errorResponse(err))
	default:
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
	}
}
