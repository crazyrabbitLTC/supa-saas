#!/bin/bash

# Run Web App with Environment Variables
# This script runs the Next.js web app with environment variables explicitly set.
# Usage: ./scripts/run-web.sh

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
echo "NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:-NOT SET}"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:+SET}"
echo "NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-NOT SET}"

# Check if any critical variables are missing
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] || [ -z "$NEXT_PUBLIC_API_URL" ]; then
  echo "ERROR: Missing critical environment variables. Please check your .env.local file."
  exit 1
fi

# Run the web app with environment variables explicitly set
echo "Starting Next.js web app..."
cd apps/web
NODE_ENV=development NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" pnpm dev 