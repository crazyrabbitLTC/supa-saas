#!/bin/bash

# Team Tests Runner
# This script runs all tests related to the Teams feature
# Usage: ./scripts/test-teams.sh

set -e

# Set test environment variables
export NODE_ENV=test

echo "Running Teams feature tests..."

# First run database tests
echo "=== Running Database Team Service tests ==="
cd packages/database
npm test -- -i --testPathPattern=teamService
cd ../..

# Then run API controller and route tests
echo "=== Running API team controller tests ==="
cd apps/api
npm test -- -i --testPathPattern=controllers/teamController
cd ../..

echo "=== Running API team routes tests ==="
cd apps/api
npm test -- -i --testPathPattern=routes/teams
cd ../..

# Finally run integration tests
echo "=== Running API team integration tests ==="
cd apps/api
npm test -- -i --testPathPattern=integration/teamFlow
cd ../..

echo "All Teams tests completed successfully!" 