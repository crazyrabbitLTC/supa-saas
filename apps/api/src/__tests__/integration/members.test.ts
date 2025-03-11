/**
 * @file Team Members Endpoints Integration Tests
 * @version 0.1.0
 * 
 * Integration tests for the team members API endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initTestServer } from '../setup/testServer';
import { v4 as uuidv4 } from 'uuid';

describe('Team Members Endpoints', () => {
  // Test context to store server, request client, and test data
  const testContext: {
    server?: any;
    request?: any;
    cleanup?: () => Promise<void>;
    auth?: any;
    testUser?: { id: string; email: string; token: string };
    testTeam?: { id: string; name: string; ownerId: string };
    testMember?: { id: string; userId: string; role: string };
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
    
    // Create a test member
    const memberUser = await testContext.auth.createTestUser();
    const memberId = await testContext.auth.addTeamMember(
      testContext.testTeam!.id,
      memberUser.id,
      'member'
    );
    
    // Get the member details
    const { data } = await testContext.server.supabase
      .from('team_members')
      .select('*')
      .eq('id', memberId)
      .single();
    
    testContext.testMember = {
      id: data.id,
      userId: memberUser.id,
      role: data.role
    };
  });

  // Cleanup after all tests
  afterAll(async () => {
    if (testContext.cleanup) {
      await testContext.cleanup();
    }
  });

  describe('PUT /teams/:id/members/:userId', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await testContext.request
        .put(`/api/v1/teams/${testContext.testTeam!.id}/members/${testContext.testMember!.userId}`)
        .send({ role: 'admin' });
      
      expect(response.status).toBe(401);
    });

    it('should update member role as owner', async () => {
      const authHeader = await testContext.auth.getAuthHeader(testContext.testUser!.id);
      
      const response = await testContext.request
        .put(`/api/v1/teams/${testContext.testTeam!.id}/members/${testContext.testMember!.userId}`)
        .set(authHeader)
        .send({ role: 'admin' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userId', testContext.testMember!.userId);
      expect(response.body).toHaveProperty('teamId', testContext.testTeam!.id);
      expect(response.body).toHaveProperty('role', 'admin');
      
      // Verify role was updated
      const teamMembersResponse = await testContext.request
        .get(`/api/v1/teams/${testContext.testTeam!.id}/members`)
        .set(authHeader);
      
      const members = teamMembersResponse.body;
      const updatedMember = members.find((m: any) => m.userId === testContext.testMember!.userId);
      
      expect(updatedMember).toBeDefined();
      expect(updatedMember.role).toBe('admin');
    });

    it('should return 403 for non-admin team member', async () => {
      // Create another regular member
      const regularUser = await testContext.auth.createTestUser();
      await testContext.auth.addTeamMember(
        testContext.testTeam!.id,
        regularUser.id,
        'member'
      );
      
      const authHeader = await testContext.auth.getAuthHeader(regularUser.id);
      
      const response = await testContext.request
        .put(`/api/v1/teams/${testContext.testTeam!.id}/members/${testContext.testMember!.userId}`)
        .set(authHeader)
        .send({ role: 'admin' });
      
      expect(response.status).toBe(403);
    });

    it('should return 403 when admin tries to update member role', async () => {
      // Create an admin user
      const adminUser = await testContext.auth.createTestUser();
      await testContext.auth.addTeamMember(
        testContext.testTeam!.id,
        adminUser.id,
        'admin'
      );
      
      const authHeader = await testContext.auth.getAuthHeader(adminUser.id);
      
      const response = await testContext.request
        .put(`/api/v1/teams/${testContext.testTeam!.id}/members/${testContext.testMember!.userId}`)
        .set(authHeader)
        .send({ role: 'admin' });
      
      // Admins don't have permission to update to admin role
      expect(response.status).toBe(403);
    });

    it('should prevent changing the role of the team owner', async () => {
      // Create an admin user
      const adminUser = await testContext.auth.createTestUser();
      await testContext.auth.addTeamMember(
        testContext.testTeam!.id,
        adminUser.id,
        'admin'
      );
      
      const authHeader = await testContext.auth.getAuthHeader(adminUser.id);
      
      // Try to change the owner's role
      const response = await testContext.request
        .put(`/api/v1/teams/${testContext.testTeam!.id}/members/${testContext.testUser!.id}`)
        .set(authHeader)
        .send({ role: 'member' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('owner');
    });

    it('should return 400 for invalid role', async () => {
      const authHeader = await testContext.auth.getAuthHeader(testContext.testUser!.id);
      
      const response = await testContext.request
        .put(`/api/v1/teams/${testContext.testTeam!.id}/members/${testContext.testMember!.userId}`)
        .set(authHeader)
        .send({ role: 'invalid-role' });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /teams/:id/members/:userId', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await testContext.request
        .delete(`/api/v1/teams/${testContext.testTeam!.id}/members/${testContext.testMember!.userId}`);
      
      expect(response.status).toBe(401);
    });

    it('should remove member as owner with 204 status', async () => {
      const authHeader = await testContext.auth.getAuthHeader(testContext.testUser!.id);
      
      const response = await testContext.request
        .delete(`/api/v1/teams/${testContext.testTeam!.id}/members/${testContext.testMember!.userId}`)
        .set(authHeader);
      
      // API returns 204 No Content on successful deletion
      expect(response.status).toBe(204);
      
      // Verify member was removed
      const teamMembersResponse = await testContext.request
        .get(`/api/v1/teams/${testContext.testTeam!.id}/members`)
        .set(authHeader);
      
      const members = teamMembersResponse.body;
      const removedMember = members.find((m: any) => m.userId === testContext.testMember!.userId);
      
      expect(removedMember).toBeUndefined();
    });

    it('should return 403 for non-admin team member', async () => {
      // Create another regular member
      const regularUser = await testContext.auth.createTestUser();
      await testContext.auth.addTeamMember(
        testContext.testTeam!.id,
        regularUser.id,
        'member'
      );
      
      const authHeader = await testContext.auth.getAuthHeader(regularUser.id);
      
      const response = await testContext.request
        .delete(`/api/v1/teams/${testContext.testTeam!.id}/members/${testContext.testMember!.userId}`)
        .set(authHeader);
      
      expect(response.status).toBe(403);
    });

    it('should allow admin to remove member with 204 status', async () => {
      // Create an admin user
      const adminUser = await testContext.auth.createTestUser();
      await testContext.auth.addTeamMember(
        testContext.testTeam!.id,
        adminUser.id,
        'admin'
      );
      
      const authHeader = await testContext.auth.getAuthHeader(adminUser.id);
      
      const response = await testContext.request
        .delete(`/api/v1/teams/${testContext.testTeam!.id}/members/${testContext.testMember!.userId}`)
        .set(authHeader);
      
      // API returns 204 No Content on successful deletion
      expect(response.status).toBe(204);
      
      // Verify member was removed
      const teamMembersResponse = await testContext.request
        .get(`/api/v1/teams/${testContext.testTeam!.id}/members`)
        .set(authHeader);
      
      const members = teamMembersResponse.body;
      const removedMember = members.find((m: any) => m.userId === testContext.testMember!.userId);
      
      expect(removedMember).toBeUndefined();
    });

    it('should return 403 when trying to remove the team owner', async () => {
      // Create an admin user
      const adminUser = await testContext.auth.createTestUser();
      await testContext.auth.addTeamMember(
        testContext.testTeam!.id,
        adminUser.id,
        'admin'
      );
      
      const authHeader = await testContext.auth.getAuthHeader(adminUser.id);
      
      const response = await testContext.request
        .delete(`/api/v1/teams/${testContext.testTeam!.id}/members/${testContext.testUser!.id}`)
        .set(authHeader);
      
      // API returns 403 Forbidden when trying to remove the owner
      expect(response.status).toBe(403);
    });

    it('should return 403 when a member tries to remove themselves', async () => {
      // Create another member
      const memberUser = await testContext.auth.createTestUser();
      await testContext.auth.addTeamMember(
        testContext.testTeam!.id,
        memberUser.id,
        'member'
      );
      
      const authHeader = await testContext.auth.getAuthHeader(memberUser.id);
      
      const response = await testContext.request
        .delete(`/api/v1/teams/${testContext.testTeam!.id}/members/${memberUser.id}`)
        .set(authHeader);
      
      // API returns 403 Forbidden when a member tries to remove themselves
      expect(response.status).toBe(403);
    });

    it('should return 204 for non-existent member', async () => {
      const authHeader = await testContext.auth.getAuthHeader(testContext.testUser!.id);
      const nonExistentUserId = uuidv4();
      
      const response = await testContext.request
        .delete(`/api/v1/teams/${testContext.testTeam!.id}/members/${nonExistentUserId}`)
        .set(authHeader);
      
      // API returns 204 No Content even for non-existent members
      expect(response.status).toBe(204);
    });
  });
}); 