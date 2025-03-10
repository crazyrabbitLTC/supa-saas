#!/bin/bash

# Team Tests Runner
# This script runs all tests related to the Teams feature using Vitest
# Usage: ./scripts/test-teams.sh

set -e

# Set test environment
export NODE_ENV=test

echo "Running Teams feature tests..."

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

echo "All Teams basic tests completed!" 