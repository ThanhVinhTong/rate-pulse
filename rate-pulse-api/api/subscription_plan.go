package api

import (
	"database/sql"
	"net/http"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/gin-gonic/gin"
)

type createSubscriptionPlanRequest struct {
	PlanName        string `json:"plan_name" binding:"required"`
	PlanPrice       string `json:"plan_price" binding:"required"`
	HistoricalDays  int32  `json:"historical_days" binding:"min=0"`
	RateLimitPerDay int32  `json:"rate_limit_per_day" binding:"min=0"`
	Features        string `json:"features"`
	IsActive        *bool  `json:"is_active"`
}

func (server *Server) createSubscriptionPlan(ctx *gin.Context) {
	var req createSubscriptionPlanRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.CreateSubscriptionPlanParams{
		PlanName:        req.PlanName,
		PlanPrice:       req.PlanPrice,
		HistoricalDays:  req.HistoricalDays,
		RateLimitPerDay: req.RateLimitPerDay,
		Features:        sql.NullString{String: req.Features, Valid: req.Features != ""},
		IsActive:        sql.NullBool{Bool: util.Value(req.IsActive), Valid: req.IsActive != nil},
	}

	plan, err := server.store.CreateSubscriptionPlan(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, plan)
}

type getSubscriptionPlanRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

func (server *Server) getSubscriptionPlan(ctx *gin.Context) {
	var req getSubscriptionPlanRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	plan, err := server.store.GetSubscriptionPlanByID(ctx, req.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, plan)
}

func (server *Server) listActiveSubscriptionPlans(ctx *gin.Context) {
	plans, err := server.store.GetActiveSubscriptionPlans(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, plans)
}

func (server *Server) listAllSubscriptionPlans(ctx *gin.Context) {
	plans, err := server.store.GetAllSubscriptionPlans(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, plans)
}

type updateSubscriptionPlanRequest struct {
	PlanName        *string `json:"plan_name"`
	PlanPrice       *string `json:"plan_price"`
	HistoricalDays  *int32  `json:"historical_days"`
	RateLimitPerDay *int32  `json:"rate_limit_per_day"`
	Features        *string `json:"features"`
	IsActive        *bool   `json:"is_active"`
}

type updateSubscriptionPlanURIRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

func (server *Server) updateSubscriptionPlan(ctx *gin.Context) {
	var uriReq updateSubscriptionPlanURIRequest
	if err := ctx.ShouldBindUri(&uriReq); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	var req updateSubscriptionPlanRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.UpdateSubscriptionPlanParams{
		PlanName:        sql.NullString{String: util.Value(req.PlanName), Valid: req.PlanName != nil},
		PlanPrice:       sql.NullString{String: util.Value(req.PlanPrice), Valid: req.PlanPrice != nil},
		HistoricalDays:  sql.NullInt32{Int32: util.Value(req.HistoricalDays), Valid: req.HistoricalDays != nil},
		RateLimitPerDay: sql.NullInt32{Int32: util.Value(req.RateLimitPerDay), Valid: req.RateLimitPerDay != nil},
		Features:        sql.NullString{String: util.Value(req.Features), Valid: req.Features != nil},
		IsActive:        sql.NullBool{Bool: util.Value(req.IsActive), Valid: req.IsActive != nil},
		PlanID:          uriReq.ID,
	}

	plan, err := server.store.UpdateSubscriptionPlan(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, plan)
}

type deleteSubscriptionPlanRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

func (server *Server) deleteSubscriptionPlan(ctx *gin.Context) {
	var req deleteSubscriptionPlanRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	if err := server.store.DeleteSubscriptionPlan(ctx, req.ID); err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Subscription plan deleted successfully"})
}
