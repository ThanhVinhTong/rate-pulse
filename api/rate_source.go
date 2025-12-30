package api

import (
	"database/sql"
	"net/http"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/gin-gonic/gin"
)

type createRateSourceRequest struct {
	SourceName    string `json:"source_name" binding:"required"`
	SourceLink    string `json:"source_link" binding:"required"`
	SourceCountry string `json:"source_country" binding:"required"`
	SourceStatus  string `json:"source_status" binding:"required"`
}

func (server *Server) createRateSource(ctx *gin.Context) {
	var req createRateSourceRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
	}

	arg := db.CreateRateSourceParams{
		SourceName:    req.SourceName,
		SourceLink:    sql.NullString{String: req.SourceLink, Valid: true},
		SourceCountry: sql.NullString{String: req.SourceCountry, Valid: true},
		SourceStatus:  sql.NullString{String: req.SourceStatus, Valid: true},
	}

	rateSource, err := server.store.CreateRateSource(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, rateSource)
}

type getRateSourceRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

func (server *Server) getRateSource(ctx *gin.Context) {
	var req getRateSourceRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
	}

	rateSource, err := server.store.GetRateSourceByID(ctx, req.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, rateSource)
}

type listRateSourceRequest struct {
	PageID   int32 `form:"page_id" binding:"required,min=1"`
	PageSize int32 `form:"page_size" binding:"required,min=5,max=10"`
}

func (server *Server) listRateSource(ctx *gin.Context) {
	var req listRateSourceRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.GetAllRateSourcesParams{
		Limit:  req.PageSize,
		Offset: (req.PageID - 1) * req.PageSize,
	}

	rateSources, err := server.store.GetAllRateSources(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, rateSources)
}

// TODO: Implement updateRateSource and deleteRateSource functions
