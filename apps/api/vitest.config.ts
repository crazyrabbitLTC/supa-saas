/**
 * @file Vitest Configuration
 * @version 0.1.0
 * 
 * Configuration for Vitest testing in the API package
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.{js,ts}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    testTimeout: 60000, // Increased from 30000 to 60000 to accommodate slower database operations
    globals: true,
    setupFiles: ['./src/__tests__/setup/vitest.setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/__tests__/setup/**', '**/__mocks__/**']
    },
    pool: 'forks', // Use separate processes for tests to avoid shared state
    poolOptions: {
      forks: {
        singleFork: true // Run all tests in a single fork for better isolation
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
}); 