/**
 * @file Simple API Integration Test
 * @version 0.1.0
 * 
 * Simple integration test that doesn't require a teams table
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import supertest from 'supertest';

describe('Simple API Tests', () => {
  // Test context
  const testContext: {
    server?: any;
    request?: any;
  } = {};

  // Setup before all tests
  beforeAll(async () => {
    // Create a new Fastify instance
    const server = Fastify({
      logger: false
    });

    // Register a simple route
    server.get('/hello', async () => {
      return { hello: 'world' };
    });

    // Ready the server
    await server.ready();

    // Create supertest instance
    const request = supertest(server.server);

    testContext.server = server;
    testContext.request = request;
  });

  // Cleanup after all tests
  afterAll(async () => {
    if (testContext.server) {
      await testContext.server.close();
    }
  });

  it('should respond with hello world', async () => {
    const response = await testContext.request.get('/hello');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ hello: 'world' });
  });
}); 