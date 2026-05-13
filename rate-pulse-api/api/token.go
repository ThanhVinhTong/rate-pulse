package api

import (
	"net/http"
	"time"

	"github.com/ThanhVinhTong/rate-pulse/service"
	"github.com/gin-gonic/gin"
)

type renewAccessTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type renewAccessTokenResponse struct {
	AccessToken          string    `json:"access_token"`
	AccessTokenExpiresAt time.Time `json:"access_token_expires_at"`
}

func (server *Server) renewAccessToken(ctx *gin.Context) {
	var req renewAccessTokenRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	res, err := server.services.Auth.RenewAccessToken(ctx, service.RenewAccessTokenInput{
		RefreshToken: req.RefreshToken,
	})
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, renewAccessTokenResponse{
		AccessToken:          res.AccessToken,
		AccessTokenExpiresAt: res.AccessTokenExpiresAt,
	})
}
