# Build stage
FROM golang:1.26-alpine3.23 AS builder
ARG MIGRATE_VERSION=v4.19.1
WORKDIR /app

RUN apk add --no-cache curl

# Cache module downloads to speed up CI rebuilds.
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /app/main main.go
RUN curl -fsSL "https://github.com/golang-migrate/migrate/releases/download/${MIGRATE_VERSION}/migrate.linux-amd64.tar.gz" \
    | tar -xz -C /app migrate && chmod +x /app/migrate

# Runtime stage
FROM alpine:3.23
WORKDIR /app

RUN apk add --no-cache ca-certificates

COPY --from=builder /app/main /app/main
COPY --from=builder /app/migrate /app/migrate
COPY start.sh wait-for.sh ./
RUN chmod +x /app/start.sh /app/wait-for.sh
COPY db/migration ./migration

RUN touch app.env
RUN chmod 644 app.env

EXPOSE 8080
ENTRYPOINT ["/app/start.sh"]
CMD ["/app/main"]