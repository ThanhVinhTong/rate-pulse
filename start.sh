#!/bin/sh

set -e

echo "Running database migrations..."
if [ -f /app/app.env ]; then
  set -a
  . /app/app.env
  set +a
fi
/app/migrate -path /app/migration -database "$DB_SOURCE" -verbose up

echo "Starting the server..."
exec "$@"