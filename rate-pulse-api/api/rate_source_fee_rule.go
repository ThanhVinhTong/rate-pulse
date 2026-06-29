package api

import (
	"net/http"
	"time"

	"github.com/ThanhVinhTong/rate-pulse/service"
	"github.com/gin-gonic/gin"
)

type createRateSourceFeeRuleRequest struct {
	SourceID           int32   `json:"source_id" binding:"required,min=1"`
	TypeID             int32   `json:"type_id" binding:"required,min=1"`
	TransactionType    string  `json:"transaction_type"`
	Channel            string  `json:"channel"`
	FeeRate            *string `json:"fee_rate"`
	FeeRateMin         *string `json:"fee_rate_min"`
	FeeRateMax         *string `json:"fee_rate_max"`
	FeeCurrencyID      *int32  `json:"fee_currency_id" binding:"omitempty,min=1"`
	FixedFee           *string `json:"fixed_fee"`
	MinFee             *string `json:"min_fee"`
	MaxFee             *string `json:"max_fee"`
	VatRate            *string `json:"vat_rate"`
	VatApplies         string  `json:"vat_applies"`
	FeeIncludesVat     *bool   `json:"fee_includes_vat"`
	SwiftFee           *string `json:"swift_fee"`
	SwiftFeeCurrencyID *int32  `json:"swift_fee_currency_id" binding:"omitempty,min=1"`
	SwiftFeeIncluded   *bool   `json:"swift_fee_included"`
	SourceURL          *string `json:"source_url"`
	SourceNote         *string `json:"source_note"`
	EffectiveFrom      string  `json:"effective_from" binding:"required"`
	EffectiveTo        *string `json:"effective_to"`
}

func (server *Server) createRateSourceFeeRule(ctx *gin.Context) {
	var req createRateSourceFeeRuleRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	effectiveFrom, err := parseRequiredFeeRuleDate("effective_from", req.EffectiveFrom)
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}
	effectiveTo, err := parseOptionalFeeRuleDate("effective_to", req.EffectiveTo)
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	rule, err := server.services.FeeRules.CreateRateSourceFeeRule(ctx, service.CreateRateSourceFeeRuleInput{
		SourceID:           req.SourceID,
		TypeID:             req.TypeID,
		TransactionType:    req.TransactionType,
		Channel:            req.Channel,
		FeeRate:            req.FeeRate,
		FeeRateMin:         req.FeeRateMin,
		FeeRateMax:         req.FeeRateMax,
		FeeCurrencyID:      req.FeeCurrencyID,
		FixedFee:           req.FixedFee,
		MinFee:             req.MinFee,
		MaxFee:             req.MaxFee,
		VatRate:            req.VatRate,
		VatApplies:         req.VatApplies,
		FeeIncludesVat:     boolValue(req.FeeIncludesVat),
		SwiftFee:           req.SwiftFee,
		SwiftFeeCurrencyID: req.SwiftFeeCurrencyID,
		SwiftFeeIncluded:   boolValue(req.SwiftFeeIncluded),
		SourceURL:          req.SourceURL,
		SourceNote:         req.SourceNote,
		EffectiveFrom:      effectiveFrom,
		EffectiveTo:        effectiveTo,
	})
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, rule)
}

type rateSourceFeeRuleURIRequest struct {
	ID int32 `uri:"id" binding:"required,min=1"`
}

func (server *Server) getRateSourceFeeRule(ctx *gin.Context) {
	var req rateSourceFeeRuleURIRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	rule, err := server.services.FeeRules.GetRateSourceFeeRule(ctx, service.GetRateSourceFeeRuleInput{
		FeeRuleID: req.ID,
	})
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, rule)
}

type listRateSourceFeeRulesRequest struct {
	SourceID *int32 `form:"source_id" binding:"omitempty,min=1"`
	ActiveOn string `form:"active_on"`
}

func (server *Server) listRateSourceFeeRules(ctx *gin.Context) {
	var req listRateSourceFeeRulesRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	activeOn, err := parseOptionalFeeRuleDate("active_on", stringPtrIfNotEmpty(req.ActiveOn))
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	rules, err := server.services.FeeRules.ListRateSourceFeeRules(ctx, service.ListRateSourceFeeRulesInput{
		SourceID: req.SourceID,
		ActiveOn: activeOn,
	})
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, rules)
}

type getActiveRateSourceFeeRuleRequest struct {
	SourceID        int32  `form:"source_id" binding:"required,min=1"`
	TypeID          int32  `form:"type_id" binding:"required,min=1"`
	TransactionType string `form:"transaction_type" binding:"required"`
	Channel         string `form:"channel"`
	EffectiveDate   string `form:"effective_date"`
}

func (server *Server) getActiveRateSourceFeeRule(ctx *gin.Context) {
	var req getActiveRateSourceFeeRuleRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	effectiveDate := time.Now()
	var err error
	if req.EffectiveDate != "" {
		effectiveDate, err = parseRequiredFeeRuleDate("effective_date", req.EffectiveDate)
		if err != nil {
			RespondServiceError(ctx, err)
			return
		}
	}

	rule, err := server.services.FeeRules.GetActiveRateSourceFeeRule(ctx, service.GetActiveRateSourceFeeRuleInput{
		SourceID:        req.SourceID,
		TypeID:          req.TypeID,
		TransactionType: req.TransactionType,
		Channel:         req.Channel,
		EffectiveDate:   effectiveDate,
	})
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, rule)
}

type updateRateSourceFeeRuleRequest struct {
	SourceID           *int32  `json:"source_id" binding:"omitempty,min=1"`
	TypeID             *int32  `json:"type_id" binding:"omitempty,min=1"`
	TransactionType    *string `json:"transaction_type"`
	Channel            *string `json:"channel"`
	FeeRate            *string `json:"fee_rate"`
	FeeRateMin         *string `json:"fee_rate_min"`
	FeeRateMax         *string `json:"fee_rate_max"`
	FeeCurrencyID      *int32  `json:"fee_currency_id" binding:"omitempty,min=1"`
	FixedFee           *string `json:"fixed_fee"`
	MinFee             *string `json:"min_fee"`
	MaxFee             *string `json:"max_fee"`
	VatRate            *string `json:"vat_rate"`
	VatApplies         *string `json:"vat_applies"`
	FeeIncludesVat     *bool   `json:"fee_includes_vat"`
	SwiftFee           *string `json:"swift_fee"`
	SwiftFeeCurrencyID *int32  `json:"swift_fee_currency_id" binding:"omitempty,min=1"`
	SwiftFeeIncluded   *bool   `json:"swift_fee_included"`
	SourceURL          *string `json:"source_url"`
	SourceNote         *string `json:"source_note"`
	EffectiveFrom      *string `json:"effective_from"`
	EffectiveTo        *string `json:"effective_to"`
}

func (server *Server) updateRateSourceFeeRule(ctx *gin.Context) {
	var uriReq rateSourceFeeRuleURIRequest
	if err := ctx.ShouldBindUri(&uriReq); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	var req updateRateSourceFeeRuleRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	effectiveFrom, err := parseOptionalFeeRuleDate("effective_from", req.EffectiveFrom)
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}
	effectiveTo, err := parseOptionalFeeRuleDate("effective_to", req.EffectiveTo)
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	rule, err := server.services.FeeRules.UpdateRateSourceFeeRule(ctx, service.UpdateRateSourceFeeRuleInput{
		FeeRuleID:          uriReq.ID,
		SourceID:           req.SourceID,
		TypeID:             req.TypeID,
		TransactionType:    req.TransactionType,
		Channel:            req.Channel,
		FeeRate:            req.FeeRate,
		FeeRateMin:         req.FeeRateMin,
		FeeRateMax:         req.FeeRateMax,
		FeeCurrencyID:      req.FeeCurrencyID,
		FixedFee:           req.FixedFee,
		MinFee:             req.MinFee,
		MaxFee:             req.MaxFee,
		VatRate:            req.VatRate,
		VatApplies:         req.VatApplies,
		FeeIncludesVat:     req.FeeIncludesVat,
		SwiftFee:           req.SwiftFee,
		SwiftFeeCurrencyID: req.SwiftFeeCurrencyID,
		SwiftFeeIncluded:   req.SwiftFeeIncluded,
		SourceURL:          req.SourceURL,
		SourceNote:         req.SourceNote,
		EffectiveFrom:      effectiveFrom,
		EffectiveTo:        effectiveTo,
	})
	if err != nil {
		RespondServiceError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, rule)
}

func (server *Server) deleteRateSourceFeeRule(ctx *gin.Context) {
	var req rateSourceFeeRuleURIRequest
	if err := ctx.ShouldBindUri(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, errorResponse(err))
		return
	}

	if err := server.services.FeeRules.DeleteRateSourceFeeRule(ctx, service.DeleteRateSourceFeeRuleInput{FeeRuleID: req.ID}); err != nil {
		RespondServiceError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Rate source fee rule deleted successfully"})
}

func parseRequiredFeeRuleDate(field string, value string) (time.Time, error) {
	if value == "" {
		return time.Time{}, service.Wrap(nil, service.ErrInvalidInput.Code, field+" is required")
	}
	parsed, err := parseFeeRuleDate(value)
	if err != nil {
		return time.Time{}, service.Wrap(err, service.ErrInvalidInput.Code, field+" must be YYYY-MM-DD or RFC3339")
	}
	return parsed, nil
}

func parseOptionalFeeRuleDate(field string, value *string) (*time.Time, error) {
	if value == nil || *value == "" {
		return nil, nil
	}
	parsed, err := parseFeeRuleDate(*value)
	if err != nil {
		return nil, service.Wrap(err, service.ErrInvalidInput.Code, field+" must be YYYY-MM-DD or RFC3339")
	}
	return &parsed, nil
}

func parseFeeRuleDate(value string) (time.Time, error) {
	if parsed, err := time.Parse("2006-01-02", value); err == nil {
		return parsed, nil
	}
	return time.Parse(time.RFC3339, value)
}

func boolValue(value *bool) bool {
	if value == nil {
		return false
	}
	return *value
}

func stringPtrIfNotEmpty(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}
