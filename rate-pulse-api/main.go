//go:generate make swagger

package main

import (
	"database/sql"
	"net"
	"time"

	"github.com/ThanhVinhTong/rate-pulse/api"
	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/gapi"
	pb "github.com/ThanhVinhTong/rate-pulse/pb"
	"github.com/ThanhVinhTong/rate-pulse/service"
	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/ThanhVinhTong/rate-pulse/worker"
	"github.com/gin-gonic/gin"
	"github.com/hibiken/asynq"
	_ "github.com/lib/pq"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	config, err := util.LoadConfig(".")
	if err != nil {
		log.Fatal().Err(err).Msg("Cannot load config")
	}

	conn, err := sql.Open(config.DBDriver, config.DBSource)
	if err != nil {
		log.Fatal().Err(err).Msg("Cannot connect to database")
	}

	conn.SetMaxOpenConns(10)
	conn.SetMaxIdleConns(10)
	conn.SetConnMaxLifetime(30 * time.Minute)
	conn.SetConnMaxIdleTime(5 * time.Minute)
	if err := conn.Ping(); err != nil {
		log.Fatal().Err(err).Msg("Cannot ping database")
	}

	defer conn.Close()

	// Run the task processor, gRPC server, and HTTP server from the same process.
	store := db.NewStore(conn)

	// Initialize task distributor and processor for handling asynchronous tasks.
	redisOpt := asynq.RedisClientOpt{
		Addr: config.RedisAddress,
	}
	taskDistributor := worker.NewRedisTaskDistributor(redisOpt)

	// Create token maker for both gRPC and HTTP servers
	tokenMaker, err := token.NewPasetoMaker(config.TokenSymmetricKey)
	if err != nil {
		log.Fatal().Err(err).Msg("Cannot create token maker")
	}

	// Initialize application service layer with dependencies.
	gin.SetMode(gin.ReleaseMode)
	services := service.NewServices(config, store, tokenMaker, taskDistributor)

	// Start Task Processor and gRPC server in separate goroutines, while the main goroutine runs the HTTP server.
	go runTaskProcessor(redisOpt, store)
	go runGrpcServer(config, services, tokenMaker)
	runGinServer(config, store, services, tokenMaker)
}

func runGinServer(
	config util.Config,
	store db.Store,
	services *service.Services,
	tokenMaker token.Maker,
) {
	server, err := api.NewServer(config, store, services, tokenMaker)
	if err != nil {
		log.Fatal().Err(err).Msg("Cannot create server")
	}

	if err := server.Start(config.HTTPServerAddress); err != nil {
		log.Fatal().Err(err).Msg("Cannot start server")
	}
}

func runGrpcServer(config util.Config, services *service.Services, tokenMaker token.Maker) {
	server, err := gapi.NewServer(config, services, tokenMaker)
	if err != nil {
		log.Fatal().Err(err).Msg("Cannot create server")
	}

	grpcServer := grpc.NewServer(grpc.UnaryInterceptor(gapi.UnaryServerInterceptor(tokenMaker)))

	pb.RegisterRatePulseAuthenticationServiceServer(grpcServer, server)
	pb.RegisterRatePulseExchangeRateServiceServer(grpcServer, server)
	pb.RegisterRatePulseInternalHealthServiceServer(grpcServer, server)
	reflection.Register(grpcServer) // Freely explore what RPC methods are available

	listener, err := net.Listen("tcp", config.GRPCServerAddress)
	if err != nil {
		log.Fatal().Err(err).Msg("Cannot create listener")
	}

	log.Info().Msgf("gRPC server started on %s", config.GRPCServerAddress)
	err = grpcServer.Serve(listener)
	if err != nil {
		log.Fatal().Err(err).Msg("Cannot serve gRPC server")
	}
}

func runTaskProcessor(redisOpt asynq.RedisClientOpt, store db.Store) {
	taskProcessor := worker.NewRedisTaskProcessor(redisOpt, store)
	log.Info().Msg("task processor created")
	if err := taskProcessor.Start(); err != nil {
		log.Fatal().Err(err).Msg("cannot start task processor")
	}
}
