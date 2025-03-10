#!/bin/bash

# Test All Components
# This script tests all components of the SaaS-Supabase monorepo boilerplate.
# Usage: ./scripts/test-all.sh

set -e

echo "Testing all components..."

# Load environment variables from .env file
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
fi

# Check if Supabase is running
if ! supabase status | grep -q "Started"; then
  echo "Supabase is not running. Starting Supabase..."
  supabase start
fi

# Build all packages
echo "Building all packages..."
pnpm build

# Test database connection
echo "Testing database connection..."
cd packages/database
NODE_OPTIONS="--import=tsx" node -e "
const { db, executeRawQuery } = require('./src/index');
async function testDb() {
  try {
    const result = await executeRawQuery('SELECT 1 as test');
    console.log('Database connection successful:', result);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}
testDb().then(success => process.exit(success ? 0 : 1));
"
cd ../..

# Test Supabase connection
echo "Testing Supabase connection..."
cd packages/database
NODE_OPTIONS="--import=tsx" node -e "
const { supabaseClient } = require('./src/index');
async function testSupabase() {
  try {
    const { data, error } = await supabaseClient.from('profiles').select('*').limit(1);
    if (error) throw error;
    console.log('Supabase connection successful:', data);
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
}
testSupabase().then(success => process.exit(success ? 0 : 1));
"
cd ../..

# Test API server
echo "Testing API server..."
cd apps/api
NODE_OPTIONS="--import=tsx" node -e "
const { buildServer } = require('./src/server');
async function testApi() {
  try {
    const server = await buildServer();
    await server.listen({ port: 0 }); // Use a random port
    const address = server.server.address();
    const port = typeof address === 'string' ? address : address?.port;
    console.log('API server started successfully on port', port);
    await server.close();
    return true;
  } catch (error) {
    console.error('API server failed to start:', error);
    return false;
  }
}
testApi().then(success => process.exit(success ? 0 : 1));
"
cd ../..

# Test background services
echo "Testing background services..."
cd apps/services
NODE_OPTIONS="--import=tsx" node -e "
const { scheduleCronJobs } = require('./src/jobs');
try {
  scheduleCronJobs();
  console.log('Background services initialized successfully');
  process.exit(0);
} catch (error) {
  console.error('Background services failed to initialize:', error);
  process.exit(1);
}
"
cd ../..

echo "All tests completed successfully!" 