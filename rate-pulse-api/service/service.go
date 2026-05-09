package service

import (
	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/ThanhVinhTong/rate-pulse/util"
)

// Services groups application use cases behind transport layers such as REST and gRPC.
type Services struct {
	Auth *AuthService
}

func NewServices(config util.Config, store *db.Store, tokenMaker token.Maker) *Services {
	return &Services{
		Auth: NewAuthService(config, store, tokenMaker),
	}
}
