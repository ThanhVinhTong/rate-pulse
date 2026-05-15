package gapi

import (
	"context"

	"github.com/ThanhVinhTong/rate-pulse/pb"
	"github.com/ThanhVinhTong/rate-pulse/service"
)

func (server *Server) GetLatestExchangeRates(
	ctx context.Context,
	req *pb.GetLatestExchangeRatesRequest,
) (*pb.GetLatestExchangeRatesResponse, error) {
	if err := validateGetLatestExchangeRatesRequest(req); err != nil {
		return nil, err
	}

	exchangeRates, err := server.services.FX.ListLatestExchangeRates(ctx, service.ListLatestExchangeRatesInput{
		SourceCurrencyID: req.GetSourceCurrencyId(),
		Limit:            req.GetLimit(),
	})
	if err != nil {
		return nil, statusFromServiceError(err)
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
