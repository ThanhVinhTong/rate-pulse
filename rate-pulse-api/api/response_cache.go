package api

import (
	"encoding/json"
	"net/http"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	cacheKeyPrefix = "rate-pulse:http:v1:"

	cacheTTLExchangeRatesLatest = 2 * time.Hour
	cacheTTLHistoricalData      = 24 * time.Hour
	cacheTTLReferenceDataMonth  = 30 * 24 * time.Hour
	cacheTTLRateSources         = 7 * 24 * time.Hour
	cacheTTLRateSourceFeeRules  = time.Hour
)

const (
	cacheKeyCurrencies         = cacheKeyPrefix + "currencies"
	cacheKeyCurrencyCodesNames = cacheKeyPrefix + "currencies:codes-and-names"
	cacheKeyCountries          = cacheKeyPrefix + "countries"
	cacheKeyExchangeRateTypes  = cacheKeyPrefix + "exchange-rate-types"
	cacheKeyRateSources        = cacheKeyPrefix + "rate-sources"
	cacheKeyRateSourceMetadata = cacheKeyPrefix + "rate-sources:metadata"
	cacheKeyRateSourceFeeRules = cacheKeyPrefix + "rate-source-fee-rules"
)

func (server *Server) cachedJSON(ctx *gin.Context, key string, ttl time.Duration, fetch func() (any, error)) {
	if cached, found, err := server.responseCache.Get(ctx.Request.Context(), key); err == nil && found {
		ctx.Data(http.StatusOK, "application/json; charset=utf-8", cached)
		return
	}

	value, err := fetch()
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	body, err := json.Marshal(value)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	_ = server.responseCache.Set(ctx.Request.Context(), key, body, ttl)
	ctx.Data(http.StatusOK, "application/json; charset=utf-8", body)
}

func (server *Server) cachedStoreJSON(ctx *gin.Context, key string, ttl time.Duration, fetch func() (any, error)) {
	if cached, found, err := server.responseCache.Get(ctx.Request.Context(), key); err == nil && found {
		ctx.Data(http.StatusOK, "application/json; charset=utf-8", cached)
		return
	}

	value, err := fetch()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	body, err := json.Marshal(value)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	_ = server.responseCache.Set(ctx.Request.Context(), key, body, ttl)
	ctx.Data(http.StatusOK, "application/json; charset=utf-8", body)
}

func (server *Server) deleteCacheKeys(ctx *gin.Context, keys ...string) {
	_ = server.responseCache.Delete(ctx.Request.Context(), keys...)
}

func (server *Server) deleteCacheKeyPrefix(ctx *gin.Context, prefix string) {
	_ = server.responseCache.DeleteByPrefix(ctx.Request.Context(), prefix)
}

func cacheKeyForRequest(ctx *gin.Context, namespace string) string {
	query, _ := url.ParseQuery(ctx.Request.URL.RawQuery)
	encodedQuery := query.Encode()
	if encodedQuery == "" {
		return cacheKeyPrefix + namespace
	}

	return cacheKeyPrefix + namespace + "?" + encodedQuery
}

func cacheKeyForRequestWithQueryValue(ctx *gin.Context, namespace string, name string, value string) string {
	query, _ := url.ParseQuery(ctx.Request.URL.RawQuery)
	query.Set(name, value)
	encodedQuery := query.Encode()
	if encodedQuery == "" {
		return cacheKeyPrefix + namespace
	}

	return cacheKeyPrefix + namespace + "?" + encodedQuery
}
