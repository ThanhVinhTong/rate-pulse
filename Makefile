postgres:
	docker run --name postgres16 --network rate-pulse-network -p 5432:5432 -e POSTGRES_USER=root -e POSTGRES_PASSWORD=12345678 -d postgres:16.10-alpine

createdb:
	docker exec -it postgres16 createdb --username=root --owner=root rate_pulse

dropdb:
	docker exec -it postgres16 dropdb rate_pulse

migrateup:
	migrate -path db/migration -database "postgresql://postgres.utiqhfmxavkncdamkeqd:Z4FUQ6aWSeDlWt42E4E9@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres" -verbose up

migratedown:
	migrate -path db/migration -database "postgresql://postgres.utiqhfmxavkncdamkeqd:Z4FUQ6aWSeDlWt42E4E9@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres" -verbose down

migratedown1:
	migrate -path db/migration -database "postgresql://postgres.utiqhfmxavkncdamkeqd:Z4FUQ6aWSeDlWt42E4E9@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres" -verbose down 1

migrateto:
	migrate -path db/migration -database "postgresql://postgres.utiqhfmxavkncdamkeqd:Z4FUQ6aWSeDlWt42E4E9@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres" -verbose goto $(version)

migrateversion:
	migrate -path db/migration -database "postgresql://postgres.utiqhfmxavkncdamkeqd:Z4FUQ6aWSeDlWt42E4E9@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres" version

sqlc:
	sqlc generate

cleancache:
	go clean -testcache

test:
	go test -v -cover ./db/sqlc

server:
	go run main.go

.PHONY: postgres createdb dropdb migrateup migratedown sqlc test server