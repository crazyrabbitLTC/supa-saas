#!/bin/bash

# Development Script
# This script starts all services in development mode.
# Usage: ./scripts/dev.sh

set -e

# Check if Supabase is running
if ! supabase status | grep -q "Started"; then
  echo "Supabase is not running. Starting Supabase..."
  supabase start
fi

# Start all services using Turborepo
echo "Starting all services in development mode..."
pnpm dev 