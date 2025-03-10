#!/bin/bash

# Run Background Services with Environment Variables
# This script runs the background services with environment variables explicitly set.
# Usage: ./scripts/run-services.sh

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
echo "SERVICES_CRON_ENABLED: ${SERVICES_CRON_ENABLED:-NOT SET}"

# Run the background services
echo "Starting background services..."
cd apps/services
node dist/index.js 