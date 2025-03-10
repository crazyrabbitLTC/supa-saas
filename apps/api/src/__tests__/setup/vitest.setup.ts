/**
 * @file Vitest Setup
 * @version 0.1.0
 * 
 * Global setup for Vitest integration tests
 */

import { beforeAll, afterAll, beforeEach, afterEach, expect } from 'vitest';
import { setupTestDb, teardownTestDb, testDb } from './testDb';

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