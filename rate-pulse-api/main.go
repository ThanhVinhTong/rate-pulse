package main

import (
	"database/sql"
	"log"
	"net"
	"time"

	"github.com/ThanhVinhTong/rate-pulse/api"
	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	"github.com/ThanhVinhTong/rate-pulse/gapi"
	pb "github.com/ThanhVinhTong/rate-pulse/pb"
	"github.com/ThanhVinhTong/rate-pulse/util"
	_ "github.com/lib/pq"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	config, err := util.LoadConfig(".")
	if err != nil {
		log.Fatal("Cannot load config: ", err)
	}

	conn, err := sql.Open(config.DBDriver, config.DBSource)
	if err != nil {
		log.Fatal("Cannot connect to database: ", err)
	}

	conn.SetMaxOpenConns(10)
	conn.SetMaxIdleConns(10)
	conn.SetConnMaxLifetime(30 * time.Minute)
	conn.SetConnMaxIdleTime(5 * time.Minute)
	if err := conn.Ping(); err != nil {
		log.Fatal("Cannot ping database: ", err)
	}

	defer conn.Close()

	// Run both servers in separate goroutines
	store := db.NewStore(conn)
	go runGrpcServer(config, store)
	runGinServer(config, store)
}

func runGinServer(config util.Config, store *db.Store) {
	server, err := api.NewServer(config, store)
	if err != nil {
		log.Fatal("Cannot create server: ", err)
	}

	err = server.Start(config.HTTPServerAddress)
	if err != nil {
		log.Fatal("Cannot start server: ", err)
	}
}

func runGrpcServer(config util.Config, store *db.Store) {
	server, err := gapi.NewServer(config, store)
	if err != nil {
		log.Fatal("Cannot create server: ", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterRatePulseServiceServer(grpcServer, server)
	reflection.Register(grpcServer) // Freely explore what RPC methods are available

	listener, err := net.Listen("tcp", config.GRPCServerAddress)
	if err != nil {
		log.Fatal("Cannot create listener")
	}

	log.Printf("gRPC server started on %s", config.GRPCServerAddress)
	err = grpcServer.Serve(listener)
	if err != nil {
		log.Fatal("Cannot serve gRPC server: ", err)
	}
}
