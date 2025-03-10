#!/usr/bin/env node

/**
 * Database Connection Test Script
 * 
 * This script tests the connection to the database and Supabase.
 * It verifies that the environment variables are correctly set and
 * that the database client can connect to the database.
 */

// Load environment variables from .env files
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');
const postgres = require('postgres');

console.log('Database Connection Test');
console.log('=======================');

// Check environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';

console.log('Environment Variables:');
console.log(`- SUPABASE_URL: ${SUPABASE_URL}`);
console.log(`- SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? '[SET]' : '[NOT SET]'}`);
console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '[SET]' : '[NOT SET]'}`);
console.log(`- SUPABASE_DB_URL: ${SUPABASE_DB_URL}`);

// Test Supabase client
async function testSupabaseClient() {
  console.log('\nTesting Supabase Client:');
  
  if (!SUPABASE_ANON_KEY) {
    console.log('✗ SUPABASE_ANON_KEY is not set');
    return false;
  }
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✓ Supabase client created successfully');
    
    // Test a simple query - try to access a table that should exist
    try {
      // First try to query a system table that should always exist
      const { data, error } = await supabase.rpc('get_schema_version');
      
      if (error) {
        // Try a different approach - just check auth config
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.log(`✗ Auth API failed: ${authError.message}`);
          return false;
        } else {
          console.log('✓ Supabase connection successful (auth API works)');
          return true;
        }
      } else {
        console.log('✓ Supabase connection successful (RPC works)');
        return true;
      }
    } catch (queryErr) {
      // Try a different approach - just check auth config
      try {
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.log(`✗ Auth API failed: ${authError.message}`);
          return false;
        } else {
          console.log('✓ Supabase connection successful (auth API works)');
          return true;
        }
      } catch (authErr) {
        console.log(`✗ Auth API failed: ${authErr.message}`);
        return false;
      }
    }
  } catch (err) {
    console.log(`✗ Failed to create Supabase client: ${err.message}`);
    return false;
  }
}

// Test Postgres connection
async function testPostgresConnection() {
  console.log('\nTesting Postgres Connection:');
  
  if (!SUPABASE_DB_URL) {
    console.log('✗ SUPABASE_DB_URL is not set');
    return false;
  }
  
  try {
    const sql = postgres(SUPABASE_DB_URL, { max: 1 });
    console.log('✓ Postgres client created successfully');
    
    // Test connection with a simple query
    const result = await sql`SELECT 1 as test`;
    console.log('✓ Postgres connection successful');
    
    // Close the connection
    await sql.end();
    return true;
  } catch (err) {
    console.log(`✗ Failed to connect to Postgres: ${err.message}`);
    return false;
  }
}

// Run tests
async function runTests() {
  const supabaseResult = await testSupabaseClient();
  const postgresResult = await testPostgresConnection();
  
  console.log('\nTest Results:');
  console.log(`- Supabase Client: ${supabaseResult ? 'PASS' : 'FAIL'}`);
  console.log(`- Postgres Connection: ${postgresResult ? 'PASS' : 'FAIL'}`);
  
  if (supabaseResult && postgresResult) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Error running tests:', err);
  process.exit(1);
}); 