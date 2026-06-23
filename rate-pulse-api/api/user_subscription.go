package api

import (
	"database/sql"
	"net/http"
	"time"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/gin-gonic/gin"
)

type createUserSubscriptionRequest struct {
	PlanID    int32      `json:"plan_id" binding:"required,min=1"`
	Status    string     `json:"status" binding:"omitempty,oneof=active cancelled expired suspended pending"`
	StartDate *time.Time `json:"start_date"`
	EndDate   *time.Time `json:"end_date"`
	AutoRenew *bool      `json:"auto_renew"`
}

func (server *Server) createUserSubscription(ctx *gin.Context) {
	authPayload := ctx.MustGet(authorizationPayloadKey).(*token.Payload)

	var req createUserSubscriptionRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	status := req.Status
	if status == "" {
		status = "active"
	}

	startDate := time.Now()
	if req.StartDate != nil {
		startDate = *req.StartDate
	}

	arg := db.CreateUserSubscriptionParams{
		UserID:    authPayload.UserID,
		PlanID:    req.PlanID,
		Status:    sql.NullString{String: status, Valid: true},
		StartDate: startDate,
		EndDate:   sql.NullTime{Time: util.Value(req.EndDate), Valid: req.EndDate != nil},
		AutoRenew: sql.NullBool{Bool: util.Value(req.AutoRenew), Valid: req.AutoRenew != nil},
	}

	subscription, err := server.store.CreateUserSubscription(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, subscription)
}

func (server *Server) listMyUserSubscriptions(ctx *gin.Context) {
	authPayload := ctx.MustGet(authorizationPayloadKey).(*token.Payload)

	subscriptions, err := server.store.GetUserSubscriptionsByUserID(ctx, authPayload.UserID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, subscriptions)
}

func (server *Server) getMyActiveUserSubscription(ctx *gin.Context) {
	authPayload := ctx.MustGet(authorizationPayloadKey).(*token.Payload)

	subscription, err := server.store.GetActiveUserSubscriptionByUserID(ctx, authPayload.UserID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, subscription)
}

func (server *Server) listAllUserSubscriptions(ctx *gin.Context) {
	subscriptions, err := server.store.GetAllUserSubscriptions(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, subscriptions)
}

type listUserSubscriptionsByStatusRequest struct {
	Status string `form:"status" binding:"required,oneof=active cancelled expired suspended pending"`
}

func (server *Server) listUserSubscriptionsByStatus(ctx *gin.Context) {
	var req listUserSubscriptionsByStatusRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	subscriptions, err := server.store.GetUserSubscriptionsByStatus(ctx, sql.NullString{String: req.Status, Valid: true})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, subscriptions)
}

type updateUserSubscriptionRequest struct {
	PlanID    *int32     `json:"plan_id"`
	Status    *string    `json:"status" binding:"omitempty,oneof=active cancelled expired suspended pending"`
	StartDate *time.Time `json:"start_date"`
	EndDate   *time.Time `json:"end_date"`
	AutoRenew *bool      `json:"auto_renew"`
}

type userSubscriptionURIRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

func (server *Server) updateUserSubscription(ctx *gin.Context) {
	var uriReq userSubscriptionURIRequest
	if err := ctx.ShouldBindUri(&uriReq); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	var req updateUserSubscriptionRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	arg := db.UpdateUserSubscriptionParams{
		PlanID:         sql.NullInt32{Int32: util.Value(req.PlanID), Valid: req.PlanID != nil},
		Status:         sql.NullString{String: util.Value(req.Status), Valid: req.Status != nil},
		StartDate:      sql.NullTime{Time: util.Value(req.StartDate), Valid: req.StartDate != nil},
		EndDate:        sql.NullTime{Time: util.Value(req.EndDate), Valid: req.EndDate != nil},
		AutoRenew:      sql.NullBool{Bool: util.Value(req.AutoRenew), Valid: req.AutoRenew != nil},
		SubscriptionID: uriReq.ID,
	}

	subscription, err := server.store.UpdateUserSubscription(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, subscription)
}

func (server *Server) deleteUserSubscription(ctx *gin.Context) {
	var req userSubscriptionURIRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	if err := server.store.DeleteUserSubscription(ctx, req.ID); err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "User subscription deleted successfully"})
}
