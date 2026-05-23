package api

import (
	"context"
	"log"
	"os"
	"testing"
	"time"

	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/service"
	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/ThanhVinhTong/rate-pulse/worker"
	"github.com/gin-gonic/gin"
	"github.com/hibiken/asynq"
	"github.com/stretchr/testify/require"
)

type noopTaskDistributor struct{}

func (noopTaskDistributor) DistributeTaskSendVerifyEmail(
	ctx context.Context,
	payload *worker.PayloadSendVerifyEmail,
	opts ...asynq.Option,
) error {
	return nil
}

func newTestServer(t *testing.T, store db.Store) *Server {
	config := util.Config{
		TokenSymmetricKey:    util.RandomString(32),
		AccessTokenDuration:  time.Minute,
		RefreshTokenDuration: time.Hour,
	}

	tokenMaker, err := token.NewPasetoMaker(config.TokenSymmetricKey)
	if err != nil {
		log.Fatal("Cannot create token maker: ", err)
	}

	taskDistributor := noopTaskDistributor{}
	services := service.NewServices(config, store, tokenMaker, taskDistributor)
	server, err := NewServer(config, store, services, tokenMaker, nil)
	require.NoError(t, err)

	return server
}

func TestMain(m *testing.M) {
	gin.SetMode(gin.TestMode)

	os.Exit(m.Run())
}
