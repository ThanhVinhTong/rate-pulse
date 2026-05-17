package api

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"unicode"

	"github.com/ThanhVinhTong/rate-pulse/service"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type fieldErrorResponse struct {
	Field  string `json:"field"`
	Reason string `json:"reason"`
}

type apiErrorResponse struct {
	Code    string               `json:"code"`
	Message string               `json:"message"`
	Fields  []fieldErrorResponse `json:"fields,omitempty"`
}

func RespondServiceError(ctx *gin.Context, err error) {
	switch service.ServiceErrorCode(err) {
	case service.ErrInvalidInput.Code:
		ctx.JSON(http.StatusBadRequest, serviceErrorResponse(err))
	case service.ErrInvalidCredentials.Code,
		service.ErrUnauthorized.Code,
		service.ErrSessionNotFound.Code,
		service.ErrSessionBlocked.Code,
		service.ErrSessionExpired.Code:
		ctx.JSON(http.StatusUnauthorized, serviceErrorResponse(err))
	case service.ErrNotFound.Code:
		ctx.JSON(http.StatusNotFound, serviceErrorResponse(err))
	case service.ErrDuplicateEmail.Code,
		service.ErrDuplicateExchangeRate.Code:
		ctx.JSON(http.StatusConflict, serviceErrorResponse(err))
	default:
		ctx.JSON(http.StatusInternalServerError, serviceErrorResponse(err))
	}
}

func errorResponse(err error) gin.H {
	var validationErrors validator.ValidationErrors
	if errors.As(err, &validationErrors) {
		fields := make([]fieldErrorResponse, 0, len(validationErrors))
		for _, fieldErr := range validationErrors {
			field := jsonFieldName(fieldErr.Field())
			fields = append(fields, fieldErrorResponse{
				Field:  field,
				Reason: validationReason(field, fieldErr),
			})
		}

		return gin.H{
			"code":    service.ErrInvalidInput.Code,
			"message": "invalid request parameters",
			"fields":  fields,
		}
	}

	var typeError *json.UnmarshalTypeError
	if errors.As(err, &typeError) {
		field := typeError.Field
		if field == "" {
			field = "body"
		}
		return gin.H{
			"code":    service.ErrInvalidInput.Code,
			"message": "invalid request parameters",
			"fields": []fieldErrorResponse{
				{Field: field, Reason: field + " has an invalid type"},
			},
		}
	}

	var syntaxError *json.SyntaxError
	if errors.As(err, &syntaxError) || errors.Is(err, io.EOF) {
		return gin.H{
			"code":    service.ErrInvalidInput.Code,
			"message": "request body must be valid JSON",
		}
	}

	return gin.H{
		"code":    "ERROR",
		"message": err.Error(),
	}
}

func serviceErrorResponse(err error) apiErrorResponse {
	return apiErrorResponse{
		Code:    service.ServiceErrorCode(err),
		Message: service.ServiceErrorMessage(err),
	}
}

func validationReason(field string, err validator.FieldError) string {
	switch err.Tag() {
	case "required":
		return field + " is required"
	case "email":
		return field + " must be a valid email address"
	case "min":
		return field + " must be at least " + err.Param()
	case "max":
		return field + " must be at most " + err.Param()
	case "oneof":
		return field + " must be one of: " + err.Param()
	default:
		return field + " is invalid"
	}
}

func jsonFieldName(field string) string {
	var words []string
	var current strings.Builder
	runes := []rune(field)

	for i, r := range runes {
		if i > 0 && unicode.IsUpper(r) {
			prev := runes[i-1]
			nextIsLower := i+1 < len(runes) && unicode.IsLower(runes[i+1])
			if unicode.IsLower(prev) || unicode.IsDigit(prev) || nextIsLower {
				words = append(words, strings.ToLower(current.String()))
				current.Reset()
			}
		}
		current.WriteRune(r)
	}
	if current.Len() > 0 {
		words = append(words, strings.ToLower(current.String()))
	}

	return strings.Join(words, "_")
}
