/**
 * @file Profile Endpoints Integration Tests
 * @version 0.1.0
 * 
 * Integration tests for the profile API endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initTestServer } from '../setup/testServer';
import { v4 as uuidv4 } from 'uuid';

describe('Profile Endpoints', () => {
  // Test context to store server, request client, and test data
  const testContext: {
    server?: any;
    request?: any;
    cleanup?: () => Promise<void>;
    auth?: any;
    testUser?: { id: string; email: string; token: string };
  } = {};

  // Setup before all tests
  beforeAll(async () => {
    const { server, request, auth, cleanup } = await initTestServer();
    testContext.server = server;
    testContext.request = request;
    testContext.auth = auth;
    testContext.cleanup = cleanup;
  });

  // Create a fresh test user before each test
  beforeEach(async () => {
    // Create a test user
    testContext.testUser = await testContext.auth.createTestUser();
  });

  // Cleanup after all tests
  afterAll(async () => {
    if (testContext.cleanup) {
      await testContext.cleanup();
    }
  });

  describe('GET /api/v1/profiles/:id', () => {
    it('should return 404 for non-existent profile', async () => {
      const nonExistentId = uuidv4();
      const response = await testContext.request.get(`/api/v1/profiles/${nonExistentId}`);
      expect(response.status).toBe(404);
    });

    it('should return profile for valid ID', async () => {
      // First ensure the profile exists in the database
      const userId = testContext.testUser!.id;
      
      // Get the profile
      const response = await testContext.request.get(`/api/v1/profiles/${userId}`);
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', userId);
    });
  });

  describe('GET /api/v1/profiles/me', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await testContext.request.get('/api/v1/profiles/me');
      expect(response.status).toBe(401);
    });

    it('should return current user profile when authenticated', async () => {
      const userId = testContext.testUser!.id;
      const authHeader = await testContext.auth.getAuthHeader(userId);
      
      const response = await testContext.request
        .get('/api/v1/profiles/me')
        .set(authHeader);
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', userId);
    });
  });

  describe('PATCH /api/v1/profiles/:id', () => {
    it('should return 401 if not authenticated', async () => {
      const userId = testContext.testUser!.id;
      const payload = { username: 'newusername' };
      
      const response = await testContext.request
        .patch(`/api/v1/profiles/${userId}`)
        .send(payload);
      
      expect(response.status).toBe(401);
    });

    it('should return 403 if trying to update another user\'s profile', async () => {
      // Create another test user
      const anotherUser = await testContext.auth.createTestUser();
      
      // Get auth header for the first user
      const userId = testContext.testUser!.id;
      const authHeader = await testContext.auth.getAuthHeader(userId);
      
      const updateData = {
        username: 'newusername',
        fullName: 'New Name'
      };
      
      const response = await testContext.request
        .patch(`/api/v1/profiles/${anotherUser.id}`)
        .set(authHeader)
        .send(updateData);
      
      expect(response.status).toBe(403);
    });

    it('should update profile with valid data', async () => {
      const userId = testContext.testUser!.id;
      const authHeader = await testContext.auth.getAuthHeader(userId);
      
      const updateData = {
        username: `user-${Date.now()}`,
        fullName: 'Updated Test User'
      };
      
      const response = await testContext.request
        .patch(`/api/v1/profiles/${userId}`)
        .set(authHeader)
        .send(updateData);
      
      // Verify response
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', updateData.username);
      expect(response.body).toHaveProperty('fullName', updateData.fullName);
      
      // Verify the profile was actually updated in the database
      const getResponse = await testContext.request
        .get(`/api/v1/profiles/${userId}`)
        .set(authHeader);
      
      expect(getResponse.body).toHaveProperty('username', updateData.username);
      expect(getResponse.body).toHaveProperty('fullName', updateData.fullName);
    });

    it('should return 400 for invalid data', async () => {
      const userId = testContext.testUser!.id;
      const authHeader = await testContext.auth.getAuthHeader(userId);
      
      // Username too short
      const invalidData = {
        username: 'a', // Less than 3 characters
      };
      
      const response = await testContext.request
        .patch(`/api/v1/profiles/${userId}`)
        .set(authHeader)
        .send(invalidData);
      
      expect(response.status).toBe(400);
    });
  });
}); 