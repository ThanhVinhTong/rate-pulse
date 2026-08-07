package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (server *Server) getLatestNewsSnapshot(ctx *gin.Context) {
	if server.services == nil || server.services.News == nil {
		ctx.JSON(http.StatusServiceUnavailable, gin.H{"error": "news service unavailable"})
		return
	}

	snapshot, err := server.services.News.GetLatestSnapshot(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	if snapshot == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "no news snapshot found"})
		return
	}

	ctx.JSON(http.StatusOK, snapshot)
}
