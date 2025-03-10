#!/bin/bash

# Run API with Environment Variables
# This script runs the API server with environment variables explicitly set.
# Usage: ./scripts/run-api.sh

set -e

# Load environment variables from .env file
if [ -f .env ]; then
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

# Run the API server
echo "Starting API server..."
cd apps/api
node dist/index.js 