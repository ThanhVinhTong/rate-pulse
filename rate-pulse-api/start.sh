#!/bin/sh

set -e

echo "Running database migrations..."

# In Kubernetes, DB_SOURCE_API is already in the environment via the Secret.
# We only load app.env if it exists (for local development).
if [ -f /app/app.env ]; then
  set -a
  . /app/app.env
  set +a
fi

# Check if DB_SOURCE_API is still empty
if [ -z "$DB_SOURCE_API" ]; then
  echo "Error: DB_SOURCE_API environment variable is not set."
  exit 1
fi

/app/migrate -path /app/migration -database "$DB_SOURCE_API" -verbose up

echo "Starting the server..."
exec "$@"