# Rate Pulse

A currency exchange rate tracking API built with Go and PostgreSQL.

## About

Rate Pulse tracks exchange rates from multiple sources across different countries. It stores currency data, rate sources, and exchange rates with support for different rate types (cash and card).

## Tech Stack

- Go (Gin framework)
- PostgreSQL
- Docker
- sqlc (SQL code generator)
- golang-migrate (database migrations)

## Project Structure

```
rate-pulse/
├── api/                    # HTTP handlers
│   ├── server.go           # Server setup and routes
│   ├── user.go             # User endpoints
│   ├── currency.go         # Currency endpoints
│   ├── country.go          # Country endpoints
│   ├── exchange_rate.go    # Exchange rate endpoints
│   └── rate_source.go      # Rate source endpoints
├── db/
│   ├── migration/          # SQL migration files
│   ├── query/              # SQL queries for sqlc
│   └── sqlc/               # Generated Go code
├── util/
│   └── config.go           # Configuration loader
├── main.go                 # Application entry point
├── Makefile                # Build commands
├── sqlc.yaml               # sqlc configuration
└── app.env                 # Environment variables
```

## Setup

### Requirements

- Go 1.21 or higher
- Docker
- Make
- golang-migrate

### Install golang-migrate

Ubuntu:
```bash
curl -L https://github.com/golang-migrate/migrate/releases/download/v4.19.1/migrate.linux-amd64.tar.gz | tar xvz
sudo mv migrate /usr/local/bin/migrate
```

Windows (using scoop):
```bash
scoop install migrate
```

### Start Database

```bash
make postgres
make createdb
make migrateup
```

### Run Server

```bash
make server
```

Server runs on http://localhost:8080

## Make Commands

| Command | Description |
|---------|-------------|
| make postgres | Start PostgreSQL container |
| make createdb | Create database |
| make dropdb | Drop database |
| make migrateup | Run all migrations |
| make migratedown | Revert all migrations |
| make sqlc | Generate Go code from SQL |
| make test (currently down for upgrading) | Run tests |
| make server | Start the server |

## API Endpoints

### Health Check

```
GET /health
```

### Users

```
POST /users              # Create user
GET  /users/:id          # Get user by ID
GET  /users              # List users (paginated)
```

### Currencies

```
POST /currencies         # Create currency
GET  /currencies/:id     # Get currency by ID
GET  /currencies         # List currencies (paginated)
```

### Countries

```
POST /countries          # Create country
GET  /countries/:id      # Get country by ID
GET  /countries          # List countries (paginated)
```

### Exchange Rates

```
POST /exchange-rates          # Create exchange rate
GET  /exchange-rates/:id      # Get exchange rate by ID
GET  /exchange-rates          # List exchange rates (paginated)
GET  /exchange-rates/type     # List by type (paginated)
```

Type values: 0 = both, 1 = cash, 2 = card

### Rate Sources

```
POST /rate-sources       # Create rate source
GET  /rate-sources/:id   # Get rate source by ID
GET  /rate-sources       # List rate sources (paginated)
```

## API Examples

### Create User

```bash
curl -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "email": "john@example.com",
    "password": "password123",
    "user_type": "free",
    "email_verified": false,
    "is_active": true
  }'
```

### Create Currency

```bash
curl -X POST http://localhost:8080/currencies \
  -H "Content-Type: application/json" \
  -d '{
    "currency_code": "USD",
    "currency_name": "US Dollar",
    "currency_symbol": "$"
  }'
```

### Create Rate Source

```bash
curl -X POST http://localhost:8080/rate-sources \
  -H "Content-Type: application/json" \
  -d '{
    "source_name": "Vietcombank",
    "source_link": "https://vietcombank.com.vn",
    "source_country": "Vietnam",
    "source_status": "active"
  }'
```

### Create Exchange Rate

```bash
curl -X POST http://localhost:8080/exchange-rates \
  -H "Content-Type: application/json" \
  -d '{
    "rate_value": "25415.50",
    "source_currency_id": 1,
    "destination_currency_id": 2,
    "valid_from_date": "2025-01-01T00:00:00Z",
    "source_id": 1,
    "type": 1
  }'
```

### Create Country

```bash
curl -X POST http://localhost:8080/countries \
  -H "Content-Type: application/json" \
  -d '{
    "country_name": "Vietnam",
    "currency_id": 1
  }'
```

### List with Pagination

All list endpoints support pagination:

```bash
curl "http://localhost:8080/users?page_id=1&page_size=5"
curl "http://localhost:8080/currencies?page_id=1&page_size=10"
curl "http://localhost:8080/exchange-rates?page_id=1&page_size=5"
```

Query parameters:
- page_id: Page number (starts from 1)
- page_size: Items per page (min 5, max 10)

## Database Tables

- users - User accounts
- currencies - Currency definitions (USD, VND, AUD, etc.)
- countries - Countries linked to currencies
- rate_sources - Exchange rate data sources (banks, etc.)
- exchange_rates - Currency exchange rates
- subscription_plans - User subscription tiers
- user_subscriptions - User subscription records
- payments - Payment records
- user_currency_preferences - User favorite currencies
- user_rate_source_preferences - User preferred rate sources

## Environment Variables
(For this, you should set the values up by yourself)
Create an `app.env` file:

```
DB_DRIVER=
DB_SOURCE=
SERVER_ADDRESS=
```

## License

See LICENSE file.
