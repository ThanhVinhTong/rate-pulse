package gapi

import (
	"fmt"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/pb"
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
	store      *db.Store
	tokenMaker token.Maker
}

// NewServer creates a gRPC server implementation.
// It wires config, DB store, and token maker used by the RPC handlers.
func NewServer(config util.Config, store *db.Store) (*Server, error) {
	tokenMaker, err := token.NewPasetoMaker(config.TokenSymmetricKey)
	if err != nil {
		return nil, fmt.Errorf("cannot create token maker: %w", err)
	}

	server := &Server{
		config:     config,
		store:      store,
		tokenMaker: tokenMaker,
	}

	return server, nil
}
