#!/bin/sh

set -e

echo "Running database migrations..."

# In Kubernetes, DB_SOURCE is already in the environment via the Secret.
# We only load app.env if it exists (for local development).
if [ -f /app/app.env ]; then
  set -a
  . /app/app.env
  set +a
fi

# Check if DB_SOURCE is still empty
if [ -z "$DB_SOURCE" ]; then
  echo "Error: DB_SOURCE environment variable is not set."
  exit 1
fi

/app/migrate -path /app/migration -database "$DB_SOURCE" -verbose up

echo "Starting the server..."
exec "$@"