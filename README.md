# Rate Pulse

A currency exchange rate tracking API built with Go and PostgreSQL.

## About

Rate Pulse tracks exchange rates from multiple sources across different countries. It stores currency data, rate sources, and exchange rates with support for different rate types (cash and card).

## Tech Stack

- **Go** (Golang) - Backend language
- **Gin** - HTTP Web Framework
- **PostgreSQL** - Relational Database
- **Docker & Docker Compose** - Containerization
- **sqlc** - Type-safe SQL code generation
- **golang-migrate** - Database migrations
- **Paseto / JWT** - Structured tokens for authentication

## Features

- **User Management**:
    - User registration and login.
    - Token-based authentication (Paseto/JWT).
    - **User Preferences**:
        - Manage favorite currencies and rate sources.
        - Set primary rate sources.
- **Currency & Country Management**:
    - CRUD operations for currencies and countries.
- **Exchange Rate Tracking**:
    - Record and retrieve exchange rates.
    - Filter rates by type (Cash/Card).
- **Rate Sources**:
    - Manage different sources of exchange rate data (e.g., Banks, APIs).
- **Middleware**:
    - Secure routes with Paseto/JWT authentication middleware.
- **Data Models** (Internal/Roadmap):
    - Subscriptions and Payments (defined in schema).

## Project Structure

```
rate-pulse/
├── api/                        # HTTP handlers & business logic
│   ├── server.go               # Server setup and router
│   ├── user.go                 # User auth & profile handlers
│   ├── user_currency_preference.go # User currency favorites
│   ├── user_rate_source_preference.go # User source preferences
│   ├── middleware.go           # Auth middleware
│   └── ... (other handlers)
├── db/
│   ├── migration/              # SQL migration files
│   ├── query/                  # SQL queries for sqlc
│   └── sqlc/                   # Generated Go code for DB interaction
├── token/                      # Token generators (Paseto/JWT)
├── util/                       # Configuration & helper functions
├── Dockerfile                  # API Container definition
├── docker-compose.yaml         # Multi-container setup
├── Makefile                    # Development commands
└── app.env                     # Environment variables
```

## Getting Started

### Prerequisites

- [Go](https://go.dev/dl/) 1.25+
- [Docker](https://www.docker.com/products/docker-desktop)
- [Make](https://www.gnu.org/software/make/)
- [golang-migrate](https://github.com/golang-migrate/migrate/tree/master/cmd/migrate) (optional, if running locally without Docker)

### Environment Variables

Create an `app.env` file in the root directory:

```env
DB_DRIVER=postgres
DB_SOURCE=postgresql://root:12345678@localhost:5432/rate_pulse?sslmode=disable
SERVER_ADDRESS=0.0.0.0:8080
TOKEN_SYMMETRIC_KEY=12345678901234567890123456789012
ACCESS_TOKEN_DURATION=15m
```

### Running with Docker Compose (Recommended)

To start the entire application (Postgres + API):

```bash
docker-compose up --build
```

The API will be available at `http://localhost:8080`.

### Running Locally

1.  **Start Postgres**:
    ```bash
    make postgres
    ```

2.  **Create Database**:
    ```bash
    make createdb
    ```

3.  **Run Migrations**:
    ```bash
    make migrateup
    ```

4.  **Start Server**:
    ```bash
    make server
    ```

## CLI Commands (Makefile)

| Command | Description |
|---------|-------------|
| `make postgres` | Start PostgreSQL container |
| `make createdb` | Create database |
| `make dropdb` | Drop database |
| `make migrateup` | Run all up migrations |
| `make migratedown` | Revert all migrations |
| `make sqlc` | Generate Go code from SQL queries |
| `make server` | Start the Go server locally |
| `make test` | Run unit tests |

## API Reference

### Authentication (Public)

- `POST /users` - Register a new user
- `POST /users/login` - Login and get access token

### User Preferences (Protected)

- **Currencies**:
    - `POST /currency-preference` - Add a favorite currency
    - `GET /currency-preferences` - List all favorite currencies
    - `GET /currency-preference-userid` - Get preferences by User ID
    - `GET /currency-preference-currid/:currency_id` - Get preferences by Currency ID
    - `PUT /currency-preference/:currency_id` - Update preference
    - `DELETE /currency-preference/:currency_id` - Remove a favorite currency

- **Rate Sources**:
    - `POST /rate-source-preferences` - Add a preferred rate source
    - `GET /rate-source-preferences` - List all rate source preferences
    - `GET /rate-source-preferences-userid` - Get preferences by User ID
    - `GET /rate-source-preferences-sourceid` - Get preferences by Source ID
    - `PUT /rate-source-preferences/:source_id` - Update preference
    - `DELETE /rate-source-preferences/:source_id` - Remove a preferred source

### Core Resources (Protected)

- **Users**:
    - `GET /users/:id` - Get user profile
    - `GET /users` - List users
    - `PUT /users/:id` - Update user
    - `DELETE /users/:id` - Delete user

- **Currencies**:
    - `POST /currencies` - Create currency
    - `GET /currencies/:id` - Get currency details
    - `GET /currencies` - List currencies

- **Countries**:
    - `POST /countries` - Create country
    - `GET /countries/:id` - Get country details
    - `GET /countries` - List countries

- **Rate Sources**:
    - `POST /rate-sources` - Create rate source
    - `GET /rate-sources/:id` - Get rate source details
    - `GET /rate-sources` - List rate sources

- **Exchange Rates**:
    - `POST /exchange-rates` - Record an exchange rate
    - `GET /exchange-rates/:id` - Get exchange rate details
    - `GET /exchange-rates` - List exchange rates
    - `GET /exchange-rates/type` - Filter rates by type (Credit/Cash)

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

### Login User

```bash
curl -X POST http://localhost:8080/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "password123"
  }'
```

### Create Currency

```bash
curl -X POST http://localhost:8080/currencies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
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
  -H "Authorization: Bearer <access_token>" \
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
  -H "Authorization: Bearer <access_token>" \
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
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "country_name": "Vietnam",
    "currency_id": 1
  }'
```

### List with Pagination

All list endpoints support pagination:

```bash
curl "http://localhost:8080/users?page_id=1&page_size=5" \
  -H "Authorization: Bearer <access_token>"

curl "http://localhost:8080/currencies?page_id=1&page_size=10" \
  -H "Authorization: Bearer <access_token>"

curl "http://localhost:8080/exchange-rates?page_id=1&page_size=5" \
  -H "Authorization: Bearer <access_token>"
```

Query parameters:
- page_id: Page number (starts from 1)
- page_size: Items per page (min 5, max 10)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
