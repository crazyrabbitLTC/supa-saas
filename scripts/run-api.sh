#!/bin/bash

# Run API with Environment Variables
# This script runs the API server with environment variables explicitly set.
# Usage: ./scripts/run-api.sh

set -e

# Load environment variables from .env.local and .env files
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local file..."
  export $(grep -v '^#' .env.local | xargs)
elif [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
fi

# Check if critical environment variables are set
echo "Checking critical environment variables:"
echo "SUPABASE_URL: ${SUPABASE_URL:-NOT SET}"
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:+SET}"
echo "SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:+SET}"
echo "SUPABASE_DB_URL: ${SUPABASE_DB_URL:-NOT SET}"
echo "API_PORT: ${API_PORT:-NOT SET}"
echo "API_HOST: ${API_HOST:-NOT SET}"

# Check if any critical variables are missing
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ -z "$SUPABASE_DB_URL" ]; then
  echo "ERROR: Missing critical environment variables. Please check your .env.local file."
  exit 1
fi

# Run the API server with environment variables explicitly set
echo "Starting API server..."
cd apps/api
NODE_ENV=development SUPABASE_URL="$SUPABASE_URL" SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" SUPABASE_DB_URL="$SUPABASE_DB_URL" API_PORT="$API_PORT" API_HOST="$API_HOST" pnpm dev 