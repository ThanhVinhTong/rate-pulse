package gapi

import (
	"fmt"

	"github.com/ThanhVinhTong/rate-pulse/pb"
	"github.com/ThanhVinhTong/rate-pulse/service"
	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/ThanhVinhTong/rate-pulse/util"
)

// Serve all gRPC requests for our rate pulse service
type Server struct {
	// Embeds default unimplemented handlers for RatePulseService RPCs.
	// Any RPC method that is not overridden will return an "unimplemented" gRPC error.
	pb.UnimplementedRatePulseAuthenticationServiceServer
	pb.UnimplementedRatePulseExchangeRateServiceServer
	config     util.Config
	services   *service.Services
	tokenMaker token.Maker
}

// NewServer creates a gRPC server implementation.
// It receives application services through dependency injection so RPC handlers
// stay transport-focused and do not depend on repositories directly.
func NewServer(config util.Config, services *service.Services, tokenMaker token.Maker) (*Server, error) {
	if services == nil {
		return nil, fmt.Errorf("services must not be nil")
	}
	if services.Auth == nil {
		return nil, fmt.Errorf("auth service must not be nil")
	}
	if services.FX == nil {
		return nil, fmt.Errorf("fx service must not be nil")
	}
	if tokenMaker == nil {
		return nil, fmt.Errorf("token maker must not be nil")
	}

	server := &Server{
		config:     config,
		services:   services,
		tokenMaker: tokenMaker,
	}

	return server, nil
}
