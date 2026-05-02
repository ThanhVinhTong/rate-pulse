package gapi

import (
	"context"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/pb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (server *Server) GetLatestExchangeRates(
	ctx context.Context,
	req *pb.GetLatestExchangeRatesRequest,
) (*pb.GetLatestExchangeRatesResponse, error) {
	exchangeRates, err := server.store.GetAllExchangeRatesTodayNormalised(
		ctx, db.GetAllExchangeRatesTodayNormalisedParams{
			SourceCurrencyID: req.GetSourceCurrencyId(),
			Limit:            req.GetLimit(),
		})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to get latest exchange rates: %s", err.Error())
	}

	pbExchangeRates := make([]*pb.LatestExchangeRate, len(exchangeRates))
	for i, exchangeRate := range exchangeRates {
		pbExchangeRates[i] = convertLatestExchangeRate(exchangeRate)
	}

	response := &pb.GetLatestExchangeRatesResponse{
		LatestExchangeRates: pbExchangeRates,
	}

	return response, nil
}
