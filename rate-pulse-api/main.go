//go:generate make swagger

package main

import (
	"database/sql"
	"errors"
	"net"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/ThanhVinhTong/rate-pulse/api"
	responsecache "github.com/ThanhVinhTong/rate-pulse/cache"
	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/email"
	"github.com/ThanhVinhTong/rate-pulse/gapi"
	pb "github.com/ThanhVinhTong/rate-pulse/pb"
	"github.com/ThanhVinhTong/rate-pulse/service"
	"github.com/ThanhVinhTong/rate-pulse/token"
	"github.com/ThanhVinhTong/rate-pulse/util"
	"github.com/ThanhVinhTong/rate-pulse/worker"
	"github.com/gin-gonic/gin"
	"github.com/hibiken/asynq"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	log.Logger = log.Output(zerolog.ConsoleWriter{
		Out:        os.Stderr,
		TimeFormat: "3:04PM",
	})

	config, err := util.LoadConfig(".")
	if err != nil {
		log.Fatal().Err(err).Msg("Cannot load config")
	}
	if err := validateRuntimeFlags(config); err != nil {
		log.Fatal().Err(err).Msg("Invalid runtime config")
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
	redisOpt, err := worker.NewRedisClientOpt(config)
	if err != nil {
		log.Fatal().Err(err).Msg("Cannot configure Redis")
	}
	taskDistributor := worker.NewRedisTaskDistributor(redisOpt)
	responseCache, err := responsecache.NewRedisResponseCache(config)
	if err != nil {
		log.Fatal().Err(err).Msg("Cannot configure response cache")
	}

	// Create a Redis client for rate limiting
	redisClient, err := responsecache.NewRedisClient(config)
	if err != nil {
		log.Fatal().Err(err).Msg("Cannot configure Redis client for rate limiting")
	}

	// Create token maker for both gRPC and HTTP servers
	tokenMaker, err := token.NewPasetoMaker(config.TokenSymmetricKey)
	if err != nil {
		log.Fatal().Err(err).Msg("Cannot create token maker")
	}

	// Initialize application service layer with dependencies.
	gin.SetMode(gin.ReleaseMode)
	services := service.NewServices(config, store, tokenMaker, taskDistributor)

	var emailSender email.Sender
	if config.EnableTaskProcessor {
		emailSender, err = email.NewBrevoSender(buildBrevoSenderConfig(config))
		if err != nil {
			log.Fatal().Err(err).Msg("Cannot create email sender")
		}
	}

	// Start Task Processor and gRPC server in separate goroutines, while the main goroutine runs the HTTP server.
	if config.EnableTaskProcessor {
		go runTaskProcessor(config, redisOpt, store, emailSender)
	}
	if config.EnableGRPCServer {
		go runGrpcServer(config, services, tokenMaker)
	}
	if config.EnableHTTPServer {
		runGinServer(config, store, services, tokenMaker, responseCache, redisClient)
		return
	}
	waitForShutdown()
}

func runGinServer(
	config util.Config,
	store db.Store,
	services *service.Services,
	tokenMaker token.Maker,
	responseCache responsecache.ResponseCache,
	redisClient *redis.Client,
) {
	server, err := api.NewServer(config, store, services, tokenMaker, redisClient)
	if err != nil {
		log.Fatal().Err(err).Msg("Cannot create server")
	}
	server.SetResponseCache(responseCache)

	log.Info().Msgf("HTTP server started on %s", config.HTTPServerAddress)
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

func runTaskProcessor(config util.Config, redisOpt asynq.RedisClientOpt, store db.Store, emailSender email.Sender) {
	taskProcessor := worker.NewRedisTaskProcessor(redisOpt, store, emailSender, config)
	log.Info().Msg("task processor created")
	if err := taskProcessor.Start(); err != nil {
		log.Fatal().Err(err).Msg("cannot start task processor")
	}
}

func waitForShutdown() {
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	log.Info().Msg("background services started")
	<-stop
	log.Info().Msg("shutdown signal received")
}

func buildBrevoSenderConfig(config util.Config) email.BrevoSenderConfig {
	return email.BrevoSenderConfig{
		SenderName:    config.EmailSenderName,
		SenderAddress: config.EmailSenderAddress,
		SMTPHost:      config.EmailSMTPHost,
		SMTPPort:      config.EmailSMTPPort,
		SMTPUsername:  firstNonBlank(config.EmailSMTPUsername, config.EmailSenderAddress),
		SMTPPassword:  config.EmailSMTPPassword,
	}
}

func firstNonBlank(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func validateRuntimeFlags(config util.Config) error {
	if !config.EnableHTTPServer && !config.EnableGRPCServer && !config.EnableTaskProcessor {
		return errors.New("at least one runtime component must be enabled")
	}
	return nil
}
