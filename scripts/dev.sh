#!/bin/bash

# Development Script
# This script starts all services in development mode.
# Usage: ./scripts/dev.sh

set -e

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "Supabase CLI is not installed. Please install it first."
  echo "https://supabase.com/docs/guides/cli"
  exit 1
fi

# Check if Supabase is running
if supabase status &> /dev/null; then
  if ! supabase status | grep -q "Started"; then
    echo "Supabase is not running. Starting Supabase..."
    supabase start
  else
    echo "Supabase is already running."
  fi
else
  echo "Supabase needs to be initialized. Running setup script..."
  ./scripts/setup.sh
fi

# Start all services using Turborepo
echo "Starting all services in development mode..."
pnpm dev 