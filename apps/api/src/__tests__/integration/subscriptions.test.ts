/**
 * @file Subscription Management Endpoints Tests
 * @version 0.1.0
 * 
 * Integration tests for the subscription management API endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initTestServer } from '../setup/testServer';
import { v4 as uuidv4 } from 'uuid';

describe('Subscription Management Endpoints', () => {
  // Test context to store server, request client, and test data
  const testContext: {
    server?: any;
    request?: any;
    cleanup?: () => Promise<void>;
    auth?: any;
    testUser?: { id: string; email: string; token: string };
    testTeam?: { id: string; name: string; ownerId: string };
  } = {};

  // Setup before all tests
  beforeAll(async () => {
    const { server, request, auth, cleanup } = await initTestServer();
    testContext.server = server;
    testContext.request = request;
    testContext.auth = auth;
    testContext.cleanup = cleanup;
  });

  // Create a fresh test user and team before each test
  beforeEach(async () => {
    // Create a test user (owner)
    testContext.testUser = await testContext.auth.createTestUser();
    
    // Create a test team
    testContext.testTeam = await testContext.auth.createTestTeam(testContext.testUser!.id);
  });

  // Cleanup after all tests
  afterAll(async () => {
    if (testContext.cleanup) {
      await testContext.cleanup();
    }
  });

  describe('GET /api/v1/teams/:id/subscription', () => {
    it('should return subscription details for team owner', async () => {
      const authHeader = await testContext.auth.getAuthHeader(testContext.testUser!.id);
      
      const response = await testContext.request
        .get(`/api/v1/teams/${testContext.testTeam!.id}/subscription`)
        .set(authHeader);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('teamId', testContext.testTeam!.id);
      expect(response.body).toHaveProperty('subscriptionTier', 'free'); // Default tier
      expect(response.body).toHaveProperty('features');
    });

    it('should return 401 if not authenticated', async () => {
      const response = await testContext.request
        .get(`/api/v1/teams/${testContext.testTeam!.id}/subscription`);
      
      expect(response.status).toBe(401);
    });

    it('should return 403 for non-member', async () => {
      // Create another user that's not a team member
      const nonMemberUser = await testContext.auth.createTestUser();
      const authHeader = await testContext.auth.getAuthHeader(nonMemberUser.id);
      
      const response = await testContext.request
        .get(`/api/v1/teams/${testContext.testTeam!.id}/subscription`)
        .set(authHeader);
      
      expect(response.status).toBe(403);
    });
  });
}); 