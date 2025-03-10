/**
 * @file Health Endpoint Integration Tests
 * @version 0.1.0
 * 
 * Integration tests for the health check endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initTestServer } from '../setup/testServer';

describe('Health Endpoints', () => {
  // Test context to store server and request client
  const testContext: {
    server?: any;
    request?: any;
    cleanup?: () => Promise<void>;
  } = {};

  // Setup before all tests
  beforeAll(async () => {
    console.log('Starting health endpoints test setup...');
    try {
      const { server, request, cleanup } = await initTestServer();
      console.log('Test server initialized successfully');
      testContext.server = server;
      testContext.request = request;
      testContext.cleanup = cleanup;
      console.log('Health endpoints test setup completed');
    } catch (error) {
      console.error('Failed to initialize test server:', error);
      throw error;
    }
  });

  // Cleanup after all tests
  afterAll(async () => {
    console.log('Starting health endpoints test cleanup...');
    if (testContext.cleanup) {
      try {
        await testContext.cleanup();
        console.log('Health endpoints test cleanup completed');
      } catch (error) {
        console.error('Cleanup failed:', error);
      }
    }
  });

  it('should return 200 OK for GET /health', async () => {
    console.log('Testing GET /health endpoint...');
    try {
      const response = await testContext.request.get('/health');
      console.log('GET /health response:', response.status, response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    } catch (error) {
      console.error('Error testing GET /health:', error);
      throw error;
    }
  });

  it('should return services info in GET /health/detailed', async () => {
    console.log('Testing GET /health/detailed endpoint...');
    try {
      const response = await testContext.request.get('/health/detailed');
      console.log('GET /health/detailed response:', response.status, response.body);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services.database');
      expect(response.body).toHaveProperty('services.supabase');
    } catch (error) {
      console.error('Error testing GET /health/detailed:', error);
      throw error;
    }
  });
}); 