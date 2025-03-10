#!/bin/bash

# Run Web App with Environment Variables
# This script runs the Next.js web app with environment variables explicitly set.
# Usage: ./scripts/run-web.sh

set -e

# Load environment variables from .env file
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
fi

# Check if critical environment variables are set
echo "Checking critical environment variables:"
echo "NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:-NOT SET}"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:+SET}"
echo "NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-NOT SET}"

# Run the web app
echo "Starting Next.js web app..."
cd apps/web
pnpm dev 