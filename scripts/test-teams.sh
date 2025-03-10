#!/bin/bash

# Team Tests Runner
# This script runs all tests related to the Teams feature using Vitest
# Usage: ./scripts/test-teams.sh

set -e

# Set test environment
export NODE_ENV=test

echo "Running Teams feature tests..."

# Add diagnostic information
echo "=== Diagnostic Information ==="
echo "Checking Supabase status..."
supabase status || echo "Supabase CLI not available or not linked to project"

echo "Checking database connection..."
if [ -n "$SUPABASE_DB_URL" ]; then
  echo "Database URL is set: $SUPABASE_DB_URL"
else
  echo "Database URL is not set. Using default: postgresql://postgres:postgres@localhost:54322/postgres"
  export SUPABASE_DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
fi

# Try to connect to the database
echo "Testing database connection..."
if command -v psql &> /dev/null; then
  PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT current_database(), current_user, version();" || echo "Failed to connect to database"
else
  echo "psql not available, skipping direct database test"
fi

# Run database tests
echo "=== Running Database Basic Tests ==="
cd packages/database
pnpm test "src/__tests__/basic.test.ts" "src/__tests__/services/teamService.test.ts"
cd ../..

# Run API tests
echo "=== Running API Basic Tests ==="
cd apps/api
pnpm test "src/__tests__/basic.test.ts" "src/__tests__/services/teamService.test.ts"
cd ../..

# Run Services tests
echo "=== Running Services Basic Tests ==="
cd apps/services
pnpm test "src/__tests__/basic.test.ts"
cd ../..

echo "All Teams basic tests completed!" 