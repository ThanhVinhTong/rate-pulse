package api

import (
	"fmt"
	"net/http"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/gin-gonic/gin"
)

// Serve all HTTP requests for our banking service
type Server struct {
	config     util.Config
	store      *db.Store
	tokenMaker token.Maker
	router     *gin.Engine
}

func NewServer(config util.Config, store *db.Store) (*Server, error) {
	tokenMaker, err := token.NewPasetoMaker(config.TokenSymmetricKey)
	if err != nil {
		return nil, fmt.Errorf("cannot create token maker: %w", err)
	}

	server := &Server{
		config:     config,
		store:      store,
		tokenMaker: tokenMaker,
	}

	server.setupRouter()
	return server, nil
}

func (server *Server) setupRouter() {
	router := gin.Default()

	// Public routes (no authentication required)
	router.POST("/users", server.createUser)
	router.POST("/users/login", server.loginUser)

	router.GET("/health", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{"message": "OK"})
	})

	// Protected routes (authentication required)
	authRoutes := router.Group("/").Use(authMiddleware(server.tokenMaker))

	// add `users` routes
	authRoutes.GET("/users/:id", server.getUser)
	authRoutes.GET("/users", server.listUser)
	// authRoutes.PUT("/users/:id", server.updateUser)
	// authRoutes.DELETE("/users/:id", server.deleteUser)

	// add `currencies` routes
	authRoutes.POST("/currencies", server.createCurrency)
	authRoutes.GET("/currencies/:id", server.getCurrency)
	authRoutes.GET("/currencies", server.listCurrency)
	// authRoutes.PUT("/currencies/:id", server.updateCurrency)
	// authRoutes.DELETE("/currencies/:id", server.deleteCurrency)

	// add `exchange-rates` routes
	authRoutes.POST("/exchange-rates", server.createExchangeRate)
	authRoutes.GET("/exchange-rates/:id", server.getExchangeRate)
	authRoutes.GET("/exchange-rates", server.listExchangeRate)
	authRoutes.GET("/exchange-rates/type", server.listExchangeRateByType)
	// authRoutes.PUT("/exchange-rates/:id", server.updateExchangeRate)
	// authRoutes.DELETE("/exchange-rates/:id", server.deleteExchangeRate)

	// add `rate-sources` routes
	authRoutes.POST("/rate-sources", server.createRateSource)
	authRoutes.GET("/rate-sources/:id", server.getRateSource)
	authRoutes.GET("/rate-sources", server.listRateSource)
	// authRoutes.PUT("/rate-sources/:id", server.updateRateSource)
	// authRoutes.DELETE("/rate-sources/:id", server.deleteRateSource)

	// add `countries` routes (admin-only routes handle authorization in handlers)
	authRoutes.POST("/countries", server.createCountry)
	authRoutes.GET("/countries/:id", server.getCountry)
	authRoutes.GET("/countries", server.listCountry)
	// authRoutes.PUT("/countries/:id", server.updateCountry)
	// authRoutes.DELETE("/countries/:id", server.deleteCountry)

	authRoutes.POST("/rate-source-preferences", server.createRateSourcePreference)
	authRoutes.GET("/rate-source-preferences-userid", server.getRateSourcePreferencesByUserID)
	authRoutes.GET("/rate-source-preferences-sourceid", server.getRateSourcePreferencesBySourceID)
	authRoutes.GET("/rate-source-preferences", server.listAllRateSourcePreferences)
	authRoutes.PUT("/rate-source-preferences/:source_id",server.updateRateSourcePreference)
	authRoutes.DELETE("/rate-source-preferences/:source_id", server.deleteRateSourcePreference)

	server.router = router
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
