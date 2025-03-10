/**
 * @file Vitest Configuration
 * @version 0.1.0
 * 
 * Configuration for Vitest testing in the services package
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup}.config.*',
    ],
    testTimeout: 30000,
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/__tests__/setup.ts', '**/__mocks__/**']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
}); 