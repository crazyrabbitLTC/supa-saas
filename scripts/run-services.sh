#!/bin/bash

# Run Background Services with Environment Variables
# This script runs the background services with environment variables explicitly set.
# Usage: ./scripts/run-services.sh

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
echo "SERVICES_CRON_ENABLED: ${SERVICES_CRON_ENABLED:-NOT SET}"

# Check if any critical variables are missing
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ -z "$SUPABASE_DB_URL" ]; then
  echo "ERROR: Missing critical environment variables. Please check your .env.local file."
  exit 1
fi

# Run the background services with environment variables explicitly set
echo "Starting background services..."
cd apps/services
NODE_ENV=development SUPABASE_URL="$SUPABASE_URL" SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" SUPABASE_DB_URL="$SUPABASE_DB_URL" SERVICES_CRON_ENABLED="$SERVICES_CRON_ENABLED" pnpm dev 