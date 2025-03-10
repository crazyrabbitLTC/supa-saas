#!/usr/bin/env node

/**
 * Environment Variable Checker
 * 
 * This script checks if all required environment variables are set.
 * It compares the variables in .env.example with the current environment.
 * 
 * Usage: node scripts/env-check.js
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env.example to get required variables
const exampleEnvPath = path.resolve(__dirname, '../.env.example');
const exampleEnv = dotenv.parse(fs.readFileSync(exampleEnvPath));

// Load current environment variables
const currentEnv = process.env;

// Check for missing variables
const missingVars = [];
for (const key in exampleEnv) {
  // Skip commented out variables (those with # at the start of the line)
  if (exampleEnv[key].startsWith('#')) continue;
  
  if (!currentEnv[key]) {
    missingVars.push(key);
  }
}

// Report results
if (missingVars.length > 0) {
  console.error('❌ Missing environment variables:');
  missingVars.forEach(variable => {
    console.error(`   - ${variable}`);
  });
  console.error('\nPlease set these variables in your .env.local file or environment.');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set.');
  process.exit(0);
} 