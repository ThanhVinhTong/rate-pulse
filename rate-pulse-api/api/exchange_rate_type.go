package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type exchangeRateTypeDTO struct {
	TypeID   int32  `json:"type_id"`
	TypeName string `json:"type_name"`
}

// listExchangeRateTypes returns all exchange rate type rows (e.g. Buy Cash, Sell Wire).
//
// GET /exchange-rate-types
func (server *Server) listExchangeRateTypes(ctx *gin.Context) {
	rows, err := server.store.ListExchangeRateTypes(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, errorResponse(err))
		return
	}

	out := make([]exchangeRateTypeDTO, 0, len(rows))
	for _, row := range rows {
		out = append(out, exchangeRateTypeDTO{
			TypeID:   row.TypeID,
			TypeName: row.TypeName,
		})
	}

	ctx.JSON(http.StatusOK, out)
}
