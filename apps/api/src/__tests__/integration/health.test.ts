/**
 * @file Health Endpoint Integration Tests
 * @version 0.1.0
 * 
 * Integration tests for the health check endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initTestServer } from '../setup/testServer';

describe('Health Endpoints', () => {
  // Test server setup
  const testContext: {
    server?: any;
    request?: any;
    cleanup?: () => Promise<void>;
  } = {};

  // Setup before all tests
  beforeAll(async () => {
    const { server, request, cleanup } = await initTestServer();
    testContext.server = server;
    testContext.request = request;
    testContext.cleanup = cleanup;
  });

  // Cleanup after all tests
  afterAll(async () => {
    if (testContext.cleanup) {
      await testContext.cleanup();
    }
  });

  it('should return 200 OK for GET /health', async () => {
    const response = await testContext.request.get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('services');
    
    // Check services
    expect(response.body.services).toHaveProperty('database');
    expect(response.body.services.database).toHaveProperty('status');
    expect(response.body.services).toHaveProperty('supabase');
    expect(response.body.services.supabase).toHaveProperty('status');
  });

  it('should return database status in health check', async () => {
    const response = await testContext.request.get('/health');
    
    expect(response.body.services.database.status).toBe('ok');
    expect(response.body.services.database).toHaveProperty('latency');
    expect(typeof response.body.services.database.latency).toBe('number');
  });

  it('should return Supabase status in health check', async () => {
    const response = await testContext.request.get('/health');
    
    expect(response.body.services.supabase.status).toBe('ok');
    expect(response.body.services.supabase).toHaveProperty('latency');
    expect(typeof response.body.services.supabase.latency).toBe('number');
  });

  it('should return detailed health info for GET /health/details', async () => {
    const response = await testContext.request.get('/health/details');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('services');
    expect(response.body).toHaveProperty('system');
    
    // Check system info
    expect(response.body.system).toHaveProperty('uptime');
    expect(response.body.system).toHaveProperty('memory');
    expect(response.body.system.memory).toHaveProperty('total');
    expect(response.body.system.memory).toHaveProperty('free');
    expect(response.body.system.memory).toHaveProperty('used');
    
    // Check services with more details
    expect(response.body.services.database).toHaveProperty('details');
    expect(response.body.services.supabase).toHaveProperty('details');
  });
}); 