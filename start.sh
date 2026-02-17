#!/bin/sh

set -e

echo "Running database migrations..."
source /app/app.env
/app/migrate -path /app/migration -database "$DB_SOURCE" -verbose up

echo "Starting the server..."
exec "$@"