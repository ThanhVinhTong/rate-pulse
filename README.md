# Rate Pulse

## Live at
https://www.rate-pulse.me/

## Overview and Purpose

Rate Pulse is a platform for faster, data-driven FX work. It pulls exchange rates, market context, and headlines into one place instead of scattering them across tabs and tools.

The **web app and API** (`client/`, `rate-pulse-api/`) cover live-style rates, conversion, charts, analytics (insights, news hub, sector heatmap), and account flows.

Alongside that, two Python projects extend what you can collect:

- **`pulse-intel`** — automated news and market scraping (e.g. Selenium-driven pipelines) to feed intel-style content into your stack.
- **`pulse_fx`** — focused FX gathering from banks and financial sites so institution-specific quotes and tables can be captured in a repeatable way.

Together, the goal is a cloud-friendly setup where transactional FX data, **`pulse-intel`** signals, and **`pulse_fx`** rate sources can converge for traders, analysts, and finance teams.

## Repository layout

```text
rate-pulse/
├── rate-pulse-api/         # Go HTTP API, Postgres, migrations, auth tokens
├── client/                 # Next.js App Router frontend (dashboard + marketing home)
├── pulse-intel/            # Python Selenium pipeline for news / market scraping
├── pulse_fx/               # Python tool for FX data gathering from institutions
├── digitalocean/           # Kubernetes manifests (service, ingress, issuer, etc.)
├── .github/workflows/      # CI/CD (API, client, pulse-intel)
├── docker-compose.yaml     # Local API + Postgres
└── README.md
```

## Tech stack

### Backend

- Go 1.25+
- Gin
- PostgreSQL
- sqlc
- golang-migrate
- Paseto / JWT

### Frontend (`client/`)

- **Next.js 16** (App Router)
- **React 19**, TypeScript
- **Tailwind CSS** with shared **CSS variables** for light/dark themes (`src/app/globals.css`)
- **class-variance-authority**, **clsx**, **tailwind-merge** for component variants and `cn()`
- **Recharts** for charts, **lucide-react** for icons, **next-themes** for theme switching, **Sonner** for toasts

UI is built from reusable primitives under `client/src/components/ui/` (panels, typography, buttons, forms, etc.) so feature code stays consistent and accessible across themes.

### DevOps

- Docker / Docker Compose
- GitHub Actions
- Kubernetes-style manifests under `digitalocean/`

### Data collection (WIP)

- Python, Selenium, Microsoft Edge WebDriver, cron-friendly jobs

## Core features

### API and data model

- User registration and login
- Token-protected routes
- Currency, country, and rate-source management
- Exchange-rate tracking and filtering by type
- User currency and rate-source preferences

### Web app

- Public home, exchange rates, and analytics
- Exchange rates dashboard: filters, per-source breakdown, converter, chart, refresh action
- Analytics: AI insight cards, news feed with region/category/search, sector heatmap
- Auth flows (login/signup), protected profile/settings/admin layouts
- Sticky footer layout and theme-aware contrast for light and dark modes

## Getting started

### 1. Backend API

**Prerequisites**

- [Go](https://go.dev/dl/) 1.25+
- [Docker](https://www.docker.com/products/docker-desktop)
- [Make](https://www.gnu.org/software/make/) (optional)

**Environment**

Create `app.env` in the project root:

```env
DB_DRIVER=postgres
DB_SOURCE=postgresql://root:12345678@localhost:5432/rate_pulse?sslmode=disable
HTTP_SERVER_ADDRESS=0.0.0.0:8080
TOKEN_SYMMETRIC_KEY=12345678901234567890123456789012
ACCESS_TOKEN_DURATION=15m
```

**Run with Docker Compose (recommended)**

```bash
docker-compose up --build
```

API: http://localhost:8080

**Run locally with Make**

```bash
make postgres
make createdb
make migrateup
make server
```

Adjust the migration database URL in the `Makefile` if your Postgres URL differs.

### 2. Frontend app

```bash
cd client
npm install
npm run dev
```

App: http://localhost:3000

Other useful commands:

```bash
npm run build   # production build
npm run lint    # ESLint
```

## API overview

### Public

- `POST /users`
- `POST /users/login`

### Protected

- Users: `GET/PUT/DELETE /users/:id`, `GET /users`
- Currencies: `POST /currencies`, `GET /currencies/:id`, `GET /currencies`
- Countries: `POST /countries`, `GET /countries/:id`, `GET /countries`
- Rate sources: `POST /rate-sources`, `GET /rate-sources/:id`, `GET /rate-sources`
- Exchange rates: `POST /exchange-rates`, `GET /exchange-rates/:id`, `GET /exchange-rates`, `GET /exchange-rates/type`
- Currency preferences: `POST /currency-preference`, `GET /currency-preferences`, `PUT/DELETE /currency-preference/:currency_id`
- Rate source preferences: `POST /rate-source-preferences`, `GET /rate-source-preferences`, `PUT/DELETE /rate-source-preferences/:source_id`

## CI/CD and deployment

Workflows such as `deploy-api.yml`, `deploy-client.yml`, and `deploy-pulse-intel.yml` typically run on pushes to `main`. They build and push images to Docker Hub (for example `vinhtongthanh57/rate-pulse-api`, `vinhtongthanh57/client`), tag with the commit SHA and `latest`, and apply manifests from `digitalocean/` where configured.

## `pulse-intel` (WIP)

Selenium-based multi-source news and market scraping, developed alongside Rate Pulse.

### Implemented / current sources

- World Monitor
- Yahoo Finance
- Gold/Oil price site

### Collected data includes

- AI insights
- Intel feed
- Regional news
- Topic sections (energy, government, think tanks, etc.)

### Planned layout

```text
pulse-intel/
├── main.py
├── README.md
├── requirements.txt
├── news/
│   ├── scraper.py
│   ├── wms.py
│   └── yfs.py
└── utils/
    ├── constants.py
    ├── dates.py
    ├── folders.py
    └── sessions.py
```

### World Monitor sections (examples)

- `ai_insights`, `intel_feed`, `world_news`, `united_states`, `europe`, `middle_east`, `africa`, `latin_america`, `asia_pacific`, `energy_and_resources`, `government`, `think_tanks`

Additional IDs exist for expansion (economic indicators, trade, supply chain, financial, technology, crypto, AI/ML, etc.).

### Run

```bash
cd pulse-intel
pip install -r requirements.txt
python main.py
```

Requires Python 3.10+, Microsoft Edge, and a matching Edge WebDriver.

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

### Roadmap notes

- Edge headless mode; reduced browser log noise in session setup
- CSV/SQLite export in progress
- Goals: normalize schema, CSV export, local SQLite storage, broader coverage

## `pulse_fx` (WIP)

Python tooling for FX information gathering from banking and financial sites using Selenium and Edge, similar in spirit to `pulse-intel` but focused on rate tables and institution-specific pages.

## License

MIT. See [LICENSE](LICENSE).
