# RatePulse — Real-Time Global Exchange Insight

RatePulse is a real-time currency intelligence platform that tracks and analyzes exchange rates across multiple countries.
It provides up-to-date data for major currencies (VND, AUD, USD, and more) and gold prices in key markets (Vietnam, Australia, United States).

- Designed for investors, travelers, and financial analysts, RatePulse offers:

- Live Exchange Monitoring — real-time conversion rates between global currencies.

- Historical Data Visualization — analyze past trends for smarter decisions.

- Gold Market Tracking — view gold prices across multiple regions.

Clean, Interactive Dashboard — powered by Next.js, TailwindCSS, and Golang for high performance and scalability.

Whether you’re managing investments or just tracking market changes, RatePulse keeps your finger on the world’s financial heartbeat.

# How to run this website locally

## Ubuntu

Make sure you have Golang, Docker and make properly installed before you do any thing. If you have any problem with permission, add sudo before the command you're having trouble with.

### 1. Install Go migration

```
curl -L https://github.com/golang-migrate/migrate/releases/download/v4.19.1/migrate.linux-amd64.tar.gz | tar xvz
mv migrate /usr/local/bin/migrate
```

### 2. Create db and migrate

```
make postgres
make createdb
make migrateup
```
