package api

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"
	"time"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/gin-gonic/gin"
)

type createPaymentRequest struct {
	SubscriptionID int32      `json:"subscription_id" binding:"required,min=1"`
	TransactionID  string     `json:"transaction_id"`
	Amount         string     `json:"amount" binding:"required"`
	CurrencyCode   string     `json:"currency_code" binding:"required,len=3"`
	PaymentMethod  string     `json:"payment_method"`
	PaymentStatus  string     `json:"payment_status" binding:"omitempty,oneof=pending completed failed refunded"`
	PaymentDate    *time.Time `json:"payment_date"`
}

func (server *Server) createPayment(ctx *gin.Context) {
	var req createPaymentRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	status := req.PaymentStatus
	if status == "" {
		status = "pending"
	}

	paymentDate := time.Now()
	if req.PaymentDate != nil {
		paymentDate = *req.PaymentDate
	}

	arg := db.CreatePaymentParams{
		SubscriptionID: req.SubscriptionID,
		TransactionID:  sql.NullString{String: req.TransactionID, Valid: req.TransactionID != ""},
		Amount:         req.Amount,
		CurrencyCode:   strings.ToUpper(req.CurrencyCode),
		PaymentMethod:  sql.NullString{String: req.PaymentMethod, Valid: req.PaymentMethod != ""},
		PaymentStatus:  sql.NullString{String: status, Valid: true},
		PaymentDate:    sql.NullTime{Time: paymentDate, Valid: true},
	}

	payment, err := server.store.CreatePayment(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, payment)
}

func (server *Server) listMyPayments(ctx *gin.Context) {
	authPayload := ctx.MustGet(authorizationPayloadKey).(*token.Payload)

	payments, err := server.store.GetPaymentsByUserID(ctx, authPayload.UserID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, payments)
}

type paymentURIRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

func (server *Server) getMyPayment(ctx *gin.Context) {
	authPayload := ctx.MustGet(authorizationPayloadKey).(*token.Payload)

	var req paymentURIRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	payment, err := server.store.GetPaymentByID(ctx, req.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	if err := server.requirePaymentOwner(ctx, payment, authPayload.UserID); err != nil {
		ctx.JSON(http.StatusForbidden, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, payment)
}

func (server *Server) requirePaymentOwner(ctx *gin.Context, payment db.Payment, userID int32) error {
	subscription, err := server.store.GetUserSubscriptionByID(ctx, payment.SubscriptionID)
	if err != nil {
		return err
	}
	if subscription.UserID != userID {
		return errors.New("payment does not belong to authenticated user")
	}
	return nil
}

func (server *Server) listAllPayments(ctx *gin.Context) {
	payments, err := server.store.GetAllPayments(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, payments)
}

type listPaymentsByStatusRequest struct {
	Status string `form:"status" binding:"required,oneof=pending completed failed refunded"`
}

func (server *Server) listPaymentsByStatus(ctx *gin.Context) {
	var req listPaymentsByStatusRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	payments, err := server.store.GetPaymentsByStatus(ctx, sql.NullString{String: req.Status, Valid: true})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, payments)
}

func (server *Server) getPayment(ctx *gin.Context) {
	var req paymentURIRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	payment, err := server.store.GetPaymentByID(ctx, req.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, payment)
}

type updatePaymentRequest struct {
	SubscriptionID *int32     `json:"subscription_id"`
	TransactionID  *string    `json:"transaction_id"`
	Amount         *string    `json:"amount"`
	CurrencyCode   *string    `json:"currency_code" binding:"omitempty,len=3"`
	PaymentMethod  *string    `json:"payment_method"`
	PaymentStatus  *string    `json:"payment_status" binding:"omitempty,oneof=pending completed failed refunded"`
	PaymentDate    *time.Time `json:"payment_date"`
}

func (server *Server) updatePayment(ctx *gin.Context) {
	var uriReq paymentURIRequest
	if err := ctx.ShouldBindUri(&uriReq); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	var req updatePaymentRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	currencyCode := util.Value(req.CurrencyCode)
	if req.CurrencyCode != nil {
		currencyCode = strings.ToUpper(currencyCode)
	}

	arg := db.UpdatePaymentParams{
		SubscriptionID: sql.NullInt32{Int32: util.Value(req.SubscriptionID), Valid: req.SubscriptionID != nil},
		TransactionID:  sql.NullString{String: util.Value(req.TransactionID), Valid: req.TransactionID != nil},
		Amount:         sql.NullString{String: util.Value(req.Amount), Valid: req.Amount != nil},
		CurrencyCode:   sql.NullString{String: currencyCode, Valid: req.CurrencyCode != nil},
		PaymentMethod:  sql.NullString{String: util.Value(req.PaymentMethod), Valid: req.PaymentMethod != nil},
		PaymentStatus:  sql.NullString{String: util.Value(req.PaymentStatus), Valid: req.PaymentStatus != nil},
		PaymentDate:    sql.NullTime{Time: util.Value(req.PaymentDate), Valid: req.PaymentDate != nil},
		PaymentID:      uriReq.ID,
	}

	payment, err := server.store.UpdatePayment(ctx, arg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, payment)
}

func (server *Server) deletePayment(ctx *gin.Context) {
	var req paymentURIRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	if err := server.store.DeletePayment(ctx, req.ID); err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Payment deleted successfully"})
}
