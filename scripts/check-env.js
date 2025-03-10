#!/usr/bin/env node

/**
 * Environment Variable Diagnostic Tool
 * 
 * This script checks if all required environment variables are set
 * and tests the Supabase client creation.
 */

// Load environment variables from .env files
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Environment Variable Diagnostic Tool');
console.log('===================================');
console.log(`Current working directory: ${process.cwd()}`);

// Check if .env files exist
console.log('\nAttempting to load .env files from various locations:');
const envFiles = ['.env.local', '.env'];
envFiles.forEach(file => {
  try {
    fs.accessSync(path.join(process.cwd(), file), fs.constants.R_OK);
    console.log(`✓ Attempted to load ${file}`);
  } catch (err) {
    console.log(`✗ Could not find or read ${file}`);
  }
});

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
  if (value) {
    // Hide sensitive keys in output
    const displayValue = varName.includes('KEY') ? '[HIDDEN FOR SECURITY]' : value;
    console.log(`✓ ${varName}: ${displayValue}`);
  } else {
    console.log(`✗ ${varName} is not set`);
  }
});

// Test Supabase client creation
console.log('\nTesting Supabase Client Creation:');
try {
  // Try to import the client module
  const { createClient } = require('@supabase/supabase-js');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('✗ Missing Supabase URL or key');
  } else {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✓ Successfully created Supabase client');
    
    // Test a simple query
    console.log('\nTesting Supabase Connection:');
    
    // Use an async IIFE to allow for async/await
    (async () => {
      try {
        // Try to access the auth API which should always be available
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log(`✗ Failed to connect to Supabase: ${error.message}`);
        } else {
          console.log('✓ Successfully connected to Supabase');
        }
      } catch (err) {
        console.log(`✗ Failed to connect to Supabase: ${err.message}`);
      }
    })();
  }
} catch (err) {
  console.log(`✗ Failed to create Supabase client: ${err.message}`);
  if (err.stack) {
    console.log(err.stack.split('\n').slice(0, 3).join('\n'));
  }
} 