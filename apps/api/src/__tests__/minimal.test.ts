/**
 * Minimal test for diagnostic purposes
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createMinimalServer } from './setup/minimalServer';

describe('Minimal Test', () => {
  const testContext: {
    server?: any;
    request?: any;
  } = {};

  beforeAll(async () => {
    const { server, request } = await createMinimalServer();
    testContext.server = server;
    testContext.request = request;
  });

  afterAll(async () => {
    if (testContext.server) {
      await testContext.server.close();
    }
  });

  it('should return 200 OK for GET /health', async () => {
    const response = await testContext.request.get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });
}); 