package api

import (
	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/gin-gonic/gin"
)

type Server struct {
	store  db.Store
	router *gin.Engine
}

func NewServer(store db.Store) *Server {
	server := &Server{store: store}
	router := gin.Default()

	server.router = router
	return server
}
