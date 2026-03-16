# Rate Pulse

## Live Demo

## Overview and Purpose

Rate Pulse is designed to help users move from fragmented market signals to faster, data-driven FX decisions. Instead of checking rates, market headlines, and sector movement across multiple tools, the platform centralizes these inputs into one workflow:

- Real-time exchange-rate monitoring and conversion
- Curated analytics views (AI insights, news hub, and sector heatmap)
- User personalization for preferred currencies and rate sources
- Automated market/news ingestion from multiple web sources (`news-scapper`)

The long-term goal is to provide a cloud-native intelligence layer that combines transactional FX data with contextual market signals, making analysis more actionable for traders, analysts, and finance-focused teams.

## What Is New

The project has evolved from an API-only service into a broader platform:

- Added a modern `client/` web app (Next.js, React, Tailwind)
- Added analytics UI features (AI insight cards, news feed, sector heatmap)
- Added deployment automation via GitHub Actions + Docker Hub + Kubernetes manifests (`digitalocean/`)
- Started a separate scraping pipeline (`news-scapper`) to feed market/news intelligence data

## Architecture

```text
rate-pulse/
├── api/                    # Go HTTP handlers and middleware
├── db/                     # Migrations, sqlc queries, generated data layer
├── token/                  # Paseto/JWT token logic
├── util/                   # Config + helper utilities
├── client/                 # Next.js frontend dashboard
├── digitalocean/           # Kubernetes manifests (deployment/service/ingress/issuer)
├── .github/workflows/      # CI/CD pipeline
├── main.go                 # API entrypoint
├── docker-compose.yaml     # Local API + Postgres runtime
└── README.md
```

## Tech Stack

### Backend

- Go 1.25+
- Gin
- PostgreSQL
- sqlc
- golang-migrate
- Paseto / JWT

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Recharts

### DevOps

- Docker / Docker Compose
- GitHub Actions
- Kubernetes manifests (DigitalOcean-style deployment setup)

### Data Collection (WIP)

- Python
- Selenium + Microsoft Edge WebDriver
- Cronjob (planned)

## Core Features

### API and Data Model

- User registration and login
- Token-protected routes
- Currency, country, and rate-source management
- Exchange-rate tracking and filtering by type
- User currency/source preference management

### Frontend Dashboard

- Exchange rate dashboard and converter UI
- Analytics page with:
  - AI Insights cards
  - News Hub (region/category filters + search)
  - Sector heatmap tiles
- Auth and protected route layouts for profile/settings/admin pages

## Getting Started

## 1) Backend API

### Prerequisites

- [Go](https://go.dev/dl/) 1.25+
- [Docker](https://www.docker.com/products/docker-desktop)
- [Make](https://www.gnu.org/software/make/) (optional but recommended)

### Environment setup

Create `app.env` in the project root:

```env
DB_DRIVER=postgres
DB_SOURCE=postgresql://root:12345678@localhost:5432/rate_pulse?sslmode=disable
SERVER_ADDRESS=0.0.0.0:8080
TOKEN_SYMMETRIC_KEY=12345678901234567890123456789012
ACCESS_TOKEN_DURATION=15m
```

### Run with Docker Compose (recommended)

```bash
docker-compose up --build
```

API: `http://localhost:8080`

### Run locally with Make

```bash
make postgres
make createdb
make migrateup
make server
```

`make migrateup` currently uses the migration database URL configured in `Makefile`. Update it first if you want migrations to run against your local Postgres instance.

## 2) Frontend App

In a new terminal:

```bash
cd client
npm install
npm run dev
```

Frontend: `http://localhost:3000`

## API Overview

### Public

- `POST /users`
- `POST /users/login`

### Protected resources

- Users: `GET/PUT/DELETE /users/:id`, `GET /users`
- Currencies: `POST /currencies`, `GET /currencies/:id`, `GET /currencies`
- Countries: `POST /countries`, `GET /countries/:id`, `GET /countries`
- Rate Sources: `POST /rate-sources`, `GET /rate-sources/:id`, `GET /rate-sources`
- Exchange Rates: `POST /exchange-rates`, `GET /exchange-rates/:id`, `GET /exchange-rates`, `GET /exchange-rates/type`
- Currency Preferences: `POST /currency-preference`, `GET /currency-preferences`, `PUT/DELETE /currency-preference/:currency_id`
- Rate Source Preferences: `POST /rate-source-preferences`, `GET /rate-source-preferences`, `PUT/DELETE /rate-source-preferences/:source_id`

## CI/CD and Deployment

Current pipeline (`.github/workflows/deploy.yml`) includes:

- Build and push image to Docker Hub: `vinhtongthanh57/rate-pulse`
- Tag strategy:
  - Commit SHA (`${{ github.sha }}`)
  - `latest`
- Deploy Kubernetes manifests from `digitalocean/` to the target droplet/cluster

## `news-scapper` (WIP)

A Selenium-based multi-source news and market scraper project that is being built alongside Rate Pulse.

### Scope

Implemented / current sources:

- World Monitor
- Yahoo Finance
- Gold/Oil price website

Collected data includes:

- AI Insights
- Intel Feed
- Regional news sections
- Topic-based sections (energy, government, think tanks)

### Planned scraper structure

```text
news-scapper/
├── main.py
├── README.md
├── requirements.txt
├── scripts/
│   ├── scrapper.py
│   ├── wms.py
│   ├── yahoo_finance_scraper.py
│   └── gold_oil_price_scraper.py
└── utils/
    ├── constants.py
    ├── dates.py
    ├── folders.py
    └── sessions.py
```

### World Monitor sections currently implemented

- `ai_insights`
- `intel_feed`
- `world_news`
- `united_states`
- `europe`
- `middle_east`
- `africa`
- `latin_america`
- `asia_pacific`
- `energy_and_resources`
- `government`
- `think_tanks`

Additional section IDs already exist for expansion:

- `economic_indicators`
- `trade_policy`
- `supply_chain`
- `financial`
- `technology`
- `crypto`
- `ai_ml`

### Scraper flow

1. Read config from `utils/constants.py`
2. Create output folder for current day
3. Start Microsoft Edge Selenium session
4. Open World Monitor
5. Scrape selected sections
6. Return nested Python dictionary output

### Scraper requirements

- Python 3.10+
- Microsoft Edge
- Matching Edge WebDriver
- `selenium`

Install:

```bash
pip install -r requirements.txt
```

Run:

```bash
python main.py
```

### Example output shape

```python
{
    "ai_insights": {
        "world_brief": "...",
        "geo_insights": [...],
        "break_news": [...]
    },
    "intel_feed": {
        "Headline": {
            "href": "https://example.com",
            "time": "5 hours ago"
        }
    }
}
```

## Notes and Roadmap

- The scraper currently uses Edge headless mode
- Browser log noise is reduced in scraper session setup
- CSV/SQLite export is in progress
- Near-term goals:
  - Normalize output schema
  - Add CSV export
  - Add SQLite local storage and CRUD
  - Expand market and economic coverage

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
