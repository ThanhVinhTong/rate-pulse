package service

import (
	"context"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/ThanhVinhTong/rate-pulse/worker"
)

// Services groups application use cases behind transport layers such as REST and gRPC.
type Services struct {
	Auth     AuthUseCase
	Users    UserUseCase
	FX       FXUseCase
	FeeRules RateSourceFeeRuleUseCase
	Health   HealthUseCase
}

func NewServices(
	config util.Config,
	store db.Store,
	tokenMaker token.Maker,
	taskDistributor worker.TaskDistributor,
) *Services {
	return &Services{
		Auth:     NewAuthService(config, store, tokenMaker, taskDistributor),
		Users:    NewUserService(store),
		FX:       NewFXService(store),
		FeeRules: NewRateSourceFeeRuleService(store),
		Health:   NewHealthService(store),
	}
}

type AuthUseCase interface {
	CreateUser(ctx context.Context, input CreateUserInput) (User, error)
	SignIn(ctx context.Context, input SignInInput) (SignInResult, error)
	RenewAccessToken(ctx context.Context, input RenewAccessTokenInput) (RenewAccessTokenResult, error)
	VerifyEmail(ctx context.Context, input VerifyEmailInput) (VerifyEmailResult, error)
	SignOut(ctx context.Context, refreshToken string) error
}

type HealthUseCase interface {
	CheckHealth(ctx context.Context) CheckHealthResult
}

type UserUseCase interface {
	GetUser(ctx context.Context, input GetUserInput) (User, error)
	ListUsers(ctx context.Context, input ListUsersInput) ([]User, error)
	UpdateUser(ctx context.Context, input UpdateUserInput) (User, error)
	AdminUpdateUser(ctx context.Context, input AdminUpdateUserInput) (User, error)
	DeleteUser(ctx context.Context, input DeleteUserInput) error
}

type FXUseCase interface {
	CreateExchangeRate(ctx context.Context, input CreateExchangeRateInput) (ExchangeRate, error)
	GetExchangeRate(ctx context.Context, input GetExchangeRateInput) (ExchangeRate, error)
	ListLatestExchangeRates(ctx context.Context, input ListLatestExchangeRatesInput) ([]LatestExchangeRate, error)
	UpdateExchangeRate(ctx context.Context, input UpdateExchangeRateInput) (ExchangeRate, error)
	DeleteExchangeRate(ctx context.Context, input DeleteExchangeRateInput) error
	GetHistoricalData(ctx context.Context, input GetHistoricalDataInput) ([]HistoricalDataPoint, error)
}

type RateSourceFeeRuleUseCase interface {
	CreateRateSourceFeeRule(ctx context.Context, input CreateRateSourceFeeRuleInput) (RateSourceFeeRule, error)
	GetRateSourceFeeRule(ctx context.Context, input GetRateSourceFeeRuleInput) (RateSourceFeeRule, error)
	ListRateSourceFeeRules(ctx context.Context, input ListRateSourceFeeRulesInput) ([]RateSourceFeeRule, error)
	GetActiveRateSourceFeeRule(ctx context.Context, input GetActiveRateSourceFeeRuleInput) (RateSourceFeeRule, error)
	UpdateRateSourceFeeRule(ctx context.Context, input UpdateRateSourceFeeRuleInput) (RateSourceFeeRule, error)
	DeleteRateSourceFeeRule(ctx context.Context, input DeleteRateSourceFeeRuleInput) error
}
