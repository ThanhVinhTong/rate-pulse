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
	router.POST("/users/signup", server.createUser)
	router.POST("/users/signin", server.loginUser)
	router.POST("/users/signout", server.logoutUser)
	router.POST("/users/renew-access-token", server.renewAccessToken)

	router.GET("/health", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{"message": "OK"})
	})

	// Protected routes (authentication required)
	authRoutes := router.Group("/").Use(authMiddleware(server.tokenMaker))
	adminRoutes := router.Group("/").Use(authMiddleware(server.tokenMaker), adminMiddleware())

	// add `users` routes
	authRoutes.GET("/users/:id", server.getUser)
	authRoutes.GET("/users", server.listUser)
	authRoutes.PUT("/users/:id", server.updateUser)
	adminRoutes.PUT("/admin/users/:id", server.adminUpdateUser)
	adminRoutes.DELETE("/admin/users/:id", server.deleteUser)

	// add `currencies` routes
	authRoutes.GET("/currencies/:id", server.getCurrency)
	authRoutes.GET("/currencies", server.listCurrency)
	adminRoutes.POST("/admin/currencies", server.createCurrency)
	adminRoutes.PUT("/admin/currencies/:id", server.updateCurrency)
	adminRoutes.DELETE("/admin/currencies/:id", server.deleteCurrency)

	// add `exchange-rates` routes
	authRoutes.GET("/exchange-rates/:id", server.getExchangeRate)
	authRoutes.GET("/exchange-rates", server.listExchangeRate)
	authRoutes.GET("/exchange-rates/type", server.listExchangeRateByType)
	adminRoutes.POST("/admin/exchange-rates", server.createExchangeRate)
	adminRoutes.PUT("/admin/exchange-rates/:id", server.updateExchangeRate)
	adminRoutes.DELETE("/admin/exchange-rates/:id", server.deleteExchangeRate)

	// add `rate-sources` routes
	authRoutes.GET("/rate-sources/:id", server.getRateSource)
	authRoutes.GET("/rate-sources", server.listRateSource)
	adminRoutes.POST("/admin/rate-sources", server.createRateSource)
	adminRoutes.PUT("/admin/rate-sources/:id", server.updateRateSource)
	adminRoutes.DELETE("/admin/rate-sources/:id", server.deleteRateSource)

	// add `countries` routes
	authRoutes.GET("/countries/:id", server.getCountry)
	authRoutes.GET("/countries/code/:country_code", server.getCountryByCode)
	authRoutes.GET("/countries", server.listCountry)
	adminRoutes.POST("/admin/countries", server.createCountry)
	adminRoutes.PUT("/admin/countries/:id", server.updateCountry)
	adminRoutes.DELETE("/admin/countries/:id", server.deleteCountry)

	authRoutes.POST("/rate-source-preferences", server.createRateSourcePreference)
	authRoutes.GET("/rate-source-preferences-userid", server.getRateSourcePreferencesByUserID)
	authRoutes.GET("/rate-source-preferences-sourceid", server.getRateSourcePreferencesBySourceID)
	authRoutes.GET("/rate-source-preferences", server.listAllRateSourcePreferences)
	authRoutes.PUT("/rate-source-preferences/:source_id", server.updateRateSourcePreference)
	authRoutes.DELETE("/rate-source-preferences/:source_id", server.deleteRateSourcePreference)

	authRoutes.POST("/currency-preference", server.createCurrencyPreference)
	authRoutes.GET("/currency-preference-userid", server.getCurrencyPreferencesByUserID)
	authRoutes.GET("/currency-preference-currid/:currency_id", server.getCurrencyPreferencesByCurrencyID)
	authRoutes.GET("/currency-preferences", server.listAllCurrencyPreferences)
	authRoutes.PUT("/currency-preference/:currency_id", server.updateCurrencyPreference)
	authRoutes.DELETE("/currency-preference/:currency_id", server.deleteCurrencyPreference)

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
