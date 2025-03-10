#!/bin/bash

# Development Script
# This script starts all services in development mode.
# Usage: ./scripts/dev.sh

set -e

# Load environment variables from .env file
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
fi

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

# Ask which service to start
echo "Which service would you like to start?"
echo "1. All services (using Turborepo)"
echo "2. API server only"
echo "3. Web app only"
echo "4. Background services only"
read -p "Enter your choice (1-4): " choice

case $choice in
  1)
    echo "Starting all services using Turborepo..."
    pnpm dev
    ;;
  2)
    echo "Starting API server..."
    ./scripts/run-api.sh
    ;;
  3)
    echo "Starting web app..."
    ./scripts/run-web.sh
    ;;
  4)
    echo "Starting background services..."
    ./scripts/run-services.sh
    ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac 