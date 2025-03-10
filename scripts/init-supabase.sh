#!/bin/bash

# Initialize Supabase Project
# This script initializes a new Supabase project for local development.
# Usage: ./scripts/init-supabase.sh

set -e

echo "Initializing Supabase project..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed. Please install it first."
    echo "https://supabase.com/docs/guides/cli"
    exit 1
fi

# Initialize Supabase project if not already initialized
if [ ! -f "supabase/config.toml" ]; then
    echo "Initializing Supabase project..."
    supabase init
else
    echo "Supabase project already initialized."
fi

# Start Supabase
echo "Starting Supabase..."
supabase start

echo "Supabase initialization complete!"
echo "You can access Supabase Studio at: http://localhost:54323"
echo "API URL: http://localhost:54321"
echo "Database URL: postgresql://postgres:postgres@localhost:54322/postgres"
echo ""
echo "To stop Supabase, run: supabase stop" 