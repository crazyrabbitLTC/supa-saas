/**
 * @file Vitest Setup
 * @version 0.1.0
 * 
 * Global setup for Vitest integration tests
 */

import { beforeAll, afterAll, beforeEach, afterEach, expect } from 'vitest';
import { setupTestDb, teardownTestDb, testDb } from './testDb';
import * as dotenv from 'dotenv';
import path from 'path';

// Setup environment variables from .env.test (or fall back to .env)
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.test') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

// Log environment variables for debugging
console.log('Environment variables loaded:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '[SET]' : '[NOT SET]');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '[SET]' : '[NOT SET]');

// Global setup - runs once before all tests
beforeAll(async () => {
  console.log('Setting up test environment...');
  await setupTestDb();
});

// Global teardown - runs once after all tests
afterAll(async () => {
  console.log('Tearing down test environment...');
  await teardownTestDb();
});

// Before each test - ensure clean state
beforeEach(async () => {
  // Clean up any data from previous tests
  await testDb.cleanup();
});

// After each test - clean up
afterEach(async () => {
  // Clean up any data created during the test
  await testDb.cleanup();
});

// Add custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
}); 