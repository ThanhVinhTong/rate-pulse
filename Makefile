postgres:
	docker run --name postgres16 -p 5432:5432 -e POSTGRES_USER=root -e POSTGRES_PASSWORD=12345678 -d postgres:16.10-alpine

createdb:
	docker exec -it postgres16 createdb --username=root --owner=root rate_pulse

dropdb:
	docker exec -it postgres16 dropdb rate_pulse

migrateup:
	migrate -path db/migration -database "postgresql://root:12345678@localhost:5432/rate_pulse?sslmode=disable" -verbose up

migratedown:
	migrate -path db/migration -database "postgresql://root:12345678@localhost:5432/rate_pulse?sslmode=disable" -verbose down

sqlc:
	sqlc generate

cleancache:
	go clean -testcache
	
test:
	go test -v -cover ./db/sqlc -run 'Test.*Currency'
	go test -v -cover ./db/sqlc -run 'Test.*RateSource'
	go test -v -cover ./db/sqlc -run 'Test.*ExchangeRate'

.PHONY: postgres createdb dropdb migrateup migratedown sqlc