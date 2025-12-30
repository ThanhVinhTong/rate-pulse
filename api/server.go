package api

import (
	"net/http"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/gin-gonic/gin"
)

// Serve all HTTP requests for our banking service
type Server struct {
	store  *db.Store
	router *gin.Engine
}

func NewServer(store *db.Store) *Server {
	server := &Server{store: store}
	router := gin.Default()

	// add `users` routes to the router
	router.POST("/users", server.createUser)
	router.GET("/users/:id", server.getUser)
	router.GET("/users", server.listUser)
	// router.PUT("/users/:id", server.updateUser)
	// router.DELETE("/users/:id", server.deleteUser)

	// add `currencies` routes to the router
	router.POST("/currencies", server.createCurrency)
	router.GET("/currencies/:id", server.getCurrency)
	router.GET("/currencies", server.listCurrency)
	// router.PUT("/currencies/:id", server.updateCurrency)
	// router.DELETE("/currencies/:id", server.deleteCurrency)

	// add `exchange-rates` routes to the router
	router.POST("/exchange-rates", server.createExchangeRate)
	router.GET("/exchange-rates/:id", server.getExchangeRate)
	router.GET("/exchange-rates", server.listExchangeRate)
	router.GET("/exchange-rates/type", server.listExchangeRateByType)
	// router.PUT("/exchange-rates/:id", server.updateExchangeRate)
	// router.DELETE("/exchange-rates/:id", server.deleteExchangeRate)

	// add `rate-sources` routes to the router
	router.POST("/rate-sources", server.createRateSource)
	router.GET("/rate-sources/:id", server.getRateSource)
	router.GET("/rate-sources", server.listRateSource)
	// router.PUT("/rate-sources/:id", server.updateRateSource)
	// router.DELETE("/rate-sources/:id", server.deleteRateSource)

	router.GET("/health", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{"message": "OK"})
	})
	server.router = router
	return server
}

// This will start the server and listen for incoming requests on the given address
// @param address: the address to start the server on
// @return error: an error if the server fails to start
func (server *Server) Start(address string) error {
	return server.router.Run(address)
}

func errorResponse(err error) gin.H {
	return gin.H{"error": err.Error()}
}
