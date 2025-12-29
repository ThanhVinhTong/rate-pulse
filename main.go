package main

import (
	"database/sql"
	"log"

	"github.com/ThanhVinhTong/rate-pulse/api"
	db "github.com/ThanhVinhTong/rate-pulse/db/sqlc"
	_ "github.com/lib/pq"
)

const (
	dbDriver      = "postgres"
	dbSource      = "postgresql://root:12345678@localhost:5432/rate_pulse?sslmode=disable"
	serverAddress = "0.0.0.0:8080" // for now only, later we will use a config file
)

func main() {
	conn, err := sql.Open(dbDriver, dbSource)
	if err != nil {
		log.Fatal("Cannot connect to database: ", err)
	}
	defer conn.Close()

	store := db.NewStore(conn)
	server := api.NewServer(store)

	err = server.Start(serverAddress)
	if err != nil {
		log.Fatal("Cannot start server: ", err)
	}
}
