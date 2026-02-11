postgres:
	docker run --name postgres16 --network rate-pulse-network -p 5432:5432 -e POSTGRES_USER=root -e POSTGRES_PASSWORD=12345678 -d postgres:16.10-alpine

createdb:
	docker exec -it postgres16 createdb --username=root --owner=root rate_pulse

dropdb:
	docker exec -it postgres16 dropdb rate_pulse

migrateup:
	migrate -path db/migration -database "postgresql://root:12345678@localhost:5432/rate_pulse?sslmode=disable" -verbose up

migratedown:
	migrate -path db/migration -database "postgresql://root:12345678@localhost:5432/rate_pulse?sslmode=disable" -verbose down

migratedown1:
	migrate -path db/migration -database "postgresql://root:12345678@localhost:5432/rate_pulse?sslmode=disable" -verbose down 1

migrateto:
	migrate -path db/migration -database "postgresql://root:12345678@localhost:5432/rate_pulse?sslmode=disable" -verbose goto $(version)

migrateversion:
	migrate -path db/migration -database "postgresql://root:12345678@localhost:5432/rate_pulse?sslmode=disable" version

sqlc:
	sqlc generate

cleancache:
	go clean -testcache

test:
	go test -v -cover ./db/sqlc

server:
	go run main.go

.PHONY: postgres createdb dropdb migrateup migratedown sqlc test server