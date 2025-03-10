#!/bin/bash

# Supabase Diagnostic Script
# This script checks the Supabase setup and helps identify issues

set -e

echo "=== Supabase Diagnostic Tool ==="
echo "Checking Supabase status..."

# Check if Supabase is running
if command -v supabase &> /dev/null; then
  echo "Supabase CLI is installed"
  supabase status || echo "Supabase CLI not linked to project or not running"
else
  echo "Supabase CLI is not installed"
fi

# Check environment variables
echo -e "\n=== Environment Variables ==="
if [ -f .env ]; then
  echo "Found .env file"
  grep -E "SUPABASE_|DATABASE_" .env | sed 's/=.*/=***/'
else
  echo "No .env file found"
fi

# Check database connection
echo -e "\n=== Database Connection ==="
if command -v psql &> /dev/null; then
  echo "PostgreSQL client is installed"
  
  # Try to connect to the database
  echo "Attempting to connect to database..."
  PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT current_database(), current_user, version();" || echo "Failed to connect to database"
  
  # List schemas
  echo -e "\nDatabase schemas:"
  PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;" || echo "Failed to list schemas"
  
  # List tables in public schema
  echo -e "\nTables in public schema:"
  PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" || echo "Failed to list tables"
  
  # Check auth schema
  echo -e "\nTables in auth schema:"
  PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth' ORDER BY table_name;" || echo "Failed to list auth tables"
  
  # Check profiles table
  echo -e "\nProfiles table structure:"
  PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' ORDER BY ordinal_position;" || echo "Failed to describe profiles table"
  
  # Check if any users exist in auth.users
  echo -e "\nUsers in auth.users:"
  PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT count(*) FROM auth.users;" || echo "Failed to count users"
  
  # Check triggers
  echo -e "\nTriggers on users table:"
  PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users' ORDER BY trigger_name;" || echo "Failed to list triggers"
else
  echo "PostgreSQL client is not installed"
fi

# Check Supabase services
echo -e "\n=== Supabase Services ==="
if command -v curl &> /dev/null; then
  echo "Testing Supabase Auth service..."
  curl -s http://localhost:54321/auth/v1/health | grep -q "alive" && echo "Auth service is running" || echo "Auth service is not responding"
else
  echo "curl is not installed, skipping service checks"
fi

echo -e "\n=== Diagnostic Complete ==="
echo "If you're experiencing issues with Supabase, try the following:"
echo "1. Run 'supabase stop' and then 'supabase start'"
echo "2. Check if migrations are applied with 'supabase db reset'"
echo "3. Ensure your .env file has the correct Supabase credentials"
echo "4. Verify that the auth triggers are correctly set up" 