package api

import (
	"net/http"
	"time"

	"github.com/ThanhVinhTong/rate-pulse/cache"
	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/service"
	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Serve all HTTP requests for our rate pulse service
type Server struct {
	config        util.Config
	store         db.Store
	tokenMaker    token.Maker
	services      *service.Services
	responseCache cache.ResponseCache
	router        *gin.Engine
}

func NewServer(
	config util.Config,
	store db.Store,
	services *service.Services,
	tokenMaker token.Maker,
) (*Server, error) {
	server := &Server{
		config:        config,
		store:         store,
		tokenMaker:    tokenMaker,
		services:      services,
		responseCache: cache.NoopResponseCache{},
	}

	server.setupRouter()
	return server, nil
}

func (server *Server) SetResponseCache(responseCache cache.ResponseCache) {
	if responseCache == nil {
		return
	}

	server.responseCache = responseCache
}

func (server *Server) setupRouter() {
	router := gin.New()
	router.Use(ginRecovery())
	router.Use(requestIDMiddleware())
	router.Use(ginLogger())
	if err := router.SetTrustedProxies(nil); err != nil {
		return
	}
	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:3000",
			"https://www.rate-pulse.me",
			"https://rate-pulse.me",
		},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept", "Authorization"},
		MaxAge:       12 * time.Hour,
	}))

	// Public routes (no authentication required)
	router.POST("/users/signup", server.createUser)
	router.POST("/users/signin", server.loginUser)
	router.POST("/users/signout", server.logoutUser)
	router.POST("/users/renew-access-token", server.renewAccessToken)
	router.POST("/users/verify-email", server.verifyEmail)

	router.GET("/health", func(ctx *gin.Context) {
		ctx.JSON(http.StatusOK, gin.H{"message": "OK"})
	})
	registerSwaggerRoutes(router)

	// Public read-only market & reference data (no auth) — browse exchange-rates & historical UIs while logged out.
	// Register specific paths before /:id routes.
	router.GET("/currencies", server.listCurrency)
	router.GET("/currencies/codes-and-names", server.listCurrencyCodesAndNames)
	router.GET("/currencies/:id", server.getCurrency)
	router.GET("/exchange-rates/:id", server.getExchangeRate)
	router.GET("/exchange-rates-latest", server.listExchangeRateToday)
	router.GET("/exchange-rates/historical", server.getHistoricalData)
	router.GET("/exchange-rate-types", server.listExchangeRateTypes)
	router.GET("/rate-sources", server.listRateSource)
	router.GET("/rate-sources/metadata", server.listRateSourceMetadata)
	router.GET("/rate-sources/:id", server.getRateSource)
	router.GET("/countries/code/:country_code", server.getCountryByCode)
	router.GET("/countries/:id", server.getCountry)
	router.GET("/countries", server.listCountry)

	// Protected routes (authentication required)
	authRoutes := router.Group("/").Use(authMiddleware(server.tokenMaker))
	adminRoutes := router.Group("/").Use(authMiddleware(server.tokenMaker), adminMiddleware())

	// add `users` routes
	authRoutes.GET("/users/:id", server.getUser)
	authRoutes.GET("/users", server.listUser)
	authRoutes.PUT("/users/:id", server.updateUser)
	adminRoutes.PUT("/admin/users/:id", server.adminUpdateUser)
	adminRoutes.DELETE("/admin/users/:id", server.deleteUser)

	// add `currencies` routes (mutations only; reads are public above)
	adminRoutes.POST("/admin/currencies", server.createCurrency)
	adminRoutes.PUT("/admin/currencies/:id", server.updateCurrency)
	adminRoutes.DELETE("/admin/currencies/:id", server.deleteCurrency)

	// add `exchange-rates` routes (mutations only; reads are public above)
	adminRoutes.POST("/admin/exchange-rates", server.createExchangeRate)
	adminRoutes.PUT("/admin/exchange-rates/:id", server.updateExchangeRate)
	adminRoutes.DELETE("/admin/exchange-rates/:id", server.deleteExchangeRate)

	// add `rate-sources` routes (mutations only; reads are public above)
	adminRoutes.POST("/admin/rate-sources", server.createRateSource)
	adminRoutes.PUT("/admin/rate-sources/:id", server.updateRateSource)
	adminRoutes.DELETE("/admin/rate-sources/:id", server.deleteRateSource)

	// add `countries` routes (mutations only; reads are public above)
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
