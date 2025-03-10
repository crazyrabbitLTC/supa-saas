#!/usr/bin/env node

/**
 * Environment Diagnostic Script
 * This script checks if environment variables are loaded correctly.
 */

console.log('Environment Variable Diagnostic Tool');
console.log('===================================');
console.log('Current working directory:', process.cwd());

// Try to load environment variables from different locations
console.log('\nAttempting to load .env files from various locations:');

try {
  require('dotenv').config({ path: '.env.local' });
  console.log('✓ Attempted to load .env.local');
} catch (error) {
  console.log('✗ Failed to load .env.local:', error.message);
}

try {
  require('dotenv').config({ path: '.env' });
  console.log('✓ Attempted to load .env');
} catch (error) {
  console.log('✗ Failed to load .env:', error.message);
}

// Check critical environment variables
console.log('\nChecking Critical Environment Variables:');
const criticalVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_URL',
  'API_PORT',
  'API_HOST'
];

criticalVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✓' : '✗';
  const display = value ? 
    (varName.includes('KEY') ? '[HIDDEN FOR SECURITY]' : value) : 
    'NOT SET';
  console.log(`${status} ${varName}: ${display}`);
});

// Try to load Supabase client directly as a test
console.log('\nTesting Supabase Client Creation:');
try {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL || 'http://localhost:54321';
  const key = process.env.SUPABASE_ANON_KEY || '';
  
  console.log(`Creating test client with:`);
  console.log(`- URL: ${url}`);
  console.log(`- Key: ${key ? '[SET]' : '[NOT SET]'}`);
  
  const client = createClient(url, key);
  console.log('✓ Supabase client created successfully');
  
  // Test a simple query
  console.log('\nTesting a simple query:');
  client.from('profiles').select('*').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('✗ Query failed:', error.message);
      } else {
        console.log('✓ Query successful:', data.length > 0 ? data.length + ' records found' : 'No records found');
      }
    })
    .catch(err => {
      console.log('✗ Query error:', err.message);
    });
} catch (error) {
  console.log('✗ Failed to create Supabase client:', error.message);
} 