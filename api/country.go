package api

import (
	"net/http"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/gin-gonic/gin"
)

type createCountryRequest struct {
	CountryName string `json:"country_name" binding:"required"`
	CurrencyID  int32  `json:"currency_id" binding:"required,min=1"`
}

func (server *Server) createCountry(ctx *gin.Context) {
	var req createCountryRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.CreateCountryParams{
		CountryName: req.CountryName,
		CurrencyID:  req.CurrencyID,
	}

	country, err := server.store.CreateCountry(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, country)
}

type getCountryRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

func (server *Server) getCountry(ctx *gin.Context) {
	var req getCountryRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	country, err := server.store.GetCountryByID(ctx, req.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, country)
}

type listCountryRequest struct {
	PageID   int32 `form:"page_id" binding:"required,min=1"`
	PageSize int32 `form:"page_size" binding:"required,min=5,max=10"`
}

func (server *Server) listCountry(ctx *gin.Context) {
	var req listCountryRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
	}

	arg := db.GetAllCountriesParams{
		Limit:  req.PageSize,
		Offset: (req.PageID - 1) * req.PageSize,
	}
	countries, err := server.store.GetAllCountries(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, countries)
}
