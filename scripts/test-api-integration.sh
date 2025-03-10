#!/bin/bash

# API Integration Tests Runner
# This script runs integration tests for the API against a real Supabase instance
# Usage: ./scripts/test-api-integration.sh

set -e

# Set test environment
export NODE_ENV=test

echo "Running API integration tests..."

# Check if Supabase is running
if ! supabase status &> /dev/null; then
  echo "Supabase is not running. Starting Supabase..."
  supabase start
fi

# Wait for Supabase to be fully ready
echo "Waiting for Supabase to be ready..."
sleep 5

# Run API integration tests
echo "=== Running API Integration Tests ==="
cd apps/api
pnpm test "src/__tests__/integration/**/*.test.ts"
cd ../..

echo "All API integration tests completed!" 