#!/usr/bin/env node

/**
 * Database Integration Test Script
 * This script tests loading the database package directly.
 */

// First, load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('Database Integration Test Tool');
console.log('=============================');
console.log('Current working directory:', process.cwd());

// Check critical environment variables before importing
console.log('\nChecking Critical Environment Variables (BEFORE import):');
const criticalVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_URL'
];

criticalVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✓' : '✗';
  const display = value ? 
    (varName.includes('KEY') ? '[HIDDEN FOR SECURITY]' : value) : 
    'NOT SET';
  console.log(`${status} ${varName}: ${display}`);
});

// Now try to import the database package
console.log('\nTrying to import database package:');
try {
  // This will trigger the database client initialization
  console.log('Importing database package...');
  const database = require('../packages/database');
  console.log('✓ Database package imported successfully');
  
  // Check if Supabase client was created
  console.log('\nVerifying Supabase clients:');
  console.log(`- supabaseAdmin exists: ${database.supabaseAdmin ? '✓' : '✗'}`);
  console.log(`- supabaseClient exists: ${database.supabaseClient ? '✓' : '✗'}`);
  
  // Try a simple query
  console.log('\nTesting database connection:');
  database.executeRawQuery('SELECT 1 as test')
    .then(result => {
      console.log('✓ Database query successful:', result);
    })
    .catch(err => {
      console.log('✗ Database query failed:', err.message);
    });
    
  // Try Supabase query
  console.log('\nTesting Supabase connection:');
  database.supabaseClient.from('profiles').select('*').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('✗ Supabase query failed:', error.message);
      } else {
        console.log('✓ Supabase query successful:', data);
      }
    })
    .catch(err => {
      console.log('✗ Supabase query error:', err.message);
    });
} catch (error) {
  console.log('✗ Failed to import database package:', error);
} 