/**
 * @file Invitation Endpoints Integration Tests
 * @version 0.1.0
 * 
 * Integration tests for the invitation API endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initTestServer } from '../setup/testServer';
import { v4 as uuidv4 } from 'uuid';

describe('Invitation Endpoints', () => {
  // Test context to store server, request client, and test data
  const testContext: {
    server?: any;
    request?: any;
    cleanup?: () => Promise<void>;
    auth?: any;
    testUser?: { id: string; email: string; token: string };
    testTeam?: { id: string; name: string; ownerId: string };
    testInvitation?: { id: string; token: string };
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
    // Create a test user
    testContext.testUser = await testContext.auth.createTestUser();
    
    // Create a test team
    testContext.testTeam = await testContext.auth.createTestTeam(testContext.testUser!.id);
    
    // Create a test invitation
    const inviteEmail = `invite-${Date.now()}@example.com`;
    const invitationId = await testContext.auth.createTeamInvitation(
      testContext.testTeam!.id,
      inviteEmail,
      testContext.testUser!.id
    );
    
    // Get the invitation details
    const { data } = await testContext.server.supabase
      .from('team_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();
    
    testContext.testInvitation = {
      id: data.id,
      token: data.token
    };
  });

  // Cleanup after all tests
  afterAll(async () => {
    if (testContext.cleanup) {
      await testContext.cleanup();
    }
  });

  describe('GET /invitations/:token', () => {
    it('should return invitation details for valid token', async () => {
      const response = await testContext.request
        .get(`/invitations/${testContext.testInvitation!.token}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('teamId', testContext.testTeam!.id);
      expect(response.body).toHaveProperty('token', testContext.testInvitation!.token);
      expect(response.body).toHaveProperty('teamName');
    });

    it('should return 404 for non-existent token', async () => {
      const nonExistentToken = uuidv4();
      
      const response = await testContext.request
        .get(`/invitations/${nonExistentToken}`);
      
      expect(response.status).toBe(404);
    });
  });

  describe('POST /invitations/:token/accept', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await testContext.request
        .post(`/invitations/${testContext.testInvitation!.token}/accept`);
      
      expect(response.status).toBe(401);
    });

    it('should accept invitation and add user to team', async () => {
      // Create a new user to accept the invitation
      const newUser = await testContext.auth.createTestUser();
      const authHeader = await testContext.auth.getAuthHeader(newUser.id);
      
      const response = await testContext.request
        .post(`/invitations/${testContext.testInvitation!.token}/accept`)
        .set(authHeader);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('teamId', testContext.testTeam!.id);
      
      // Verify user was added to the team
      const teamMembersResponse = await testContext.request
        .get(`/teams/${testContext.testTeam!.id}/members`)
        .set(await testContext.auth.getAuthHeader(testContext.testUser!.id));
      
      const members = teamMembersResponse.body;
      const newMember = members.find((m: any) => m.userId === newUser.id);
      
      expect(newMember).toBeDefined();
      expect(newMember.teamId).toBe(testContext.testTeam!.id);
      expect(newMember.userId).toBe(newUser.id);
      
      // Verify invitation was deleted
      const invitationResponse = await testContext.request
        .get(`/invitations/${testContext.testInvitation!.token}`);
      
      expect(invitationResponse.status).toBe(404);
    });

    it('should return 404 for non-existent token', async () => {
      const nonExistentToken = uuidv4();
      const authHeader = await testContext.auth.getAuthHeader(testContext.testUser!.id);
      
      const response = await testContext.request
        .post(`/invitations/${nonExistentToken}/accept`)
        .set(authHeader);
      
      expect(response.status).toBe(404);
    });

    it('should return 400 if user is already a team member', async () => {
      // Try to accept invitation as the team owner (already a member)
      const authHeader = await testContext.auth.getAuthHeader(testContext.testUser!.id);
      
      const response = await testContext.request
        .post(`/invitations/${testContext.testInvitation!.token}/accept`)
        .set(authHeader);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already a member');
    });
  });

  describe('DELETE /teams/:id/invitations/:invitationId', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await testContext.request
        .delete(`/teams/${testContext.testTeam!.id}/invitations/${testContext.testInvitation!.id}`);
      
      expect(response.status).toBe(401);
    });

    it('should delete invitation as team owner', async () => {
      const authHeader = await testContext.auth.getAuthHeader(testContext.testUser!.id);
      
      const response = await testContext.request
        .delete(`/teams/${testContext.testTeam!.id}/invitations/${testContext.testInvitation!.id}`)
        .set(authHeader);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      
      // Verify invitation was deleted
      const invitationResponse = await testContext.request
        .get(`/invitations/${testContext.testInvitation!.token}`);
      
      expect(invitationResponse.status).toBe(404);
    });

    it('should return 403 for non-admin team member', async () => {
      // Create a new user and add as regular member
      const memberUser = await testContext.auth.createTestUser();
      await testContext.auth.addTeamMember(
        testContext.testTeam!.id,
        memberUser.id,
        'member'
      );
      
      const authHeader = await testContext.auth.getAuthHeader(memberUser.id);
      
      const response = await testContext.request
        .delete(`/teams/${testContext.testTeam!.id}/invitations/${testContext.testInvitation!.id}`)
        .set(authHeader);
      
      expect(response.status).toBe(403);
    });

    it('should allow admin to delete invitation', async () => {
      // Create a new user and add as admin
      const adminUser = await testContext.auth.createTestUser();
      await testContext.auth.addTeamMember(
        testContext.testTeam!.id,
        adminUser.id,
        'admin'
      );
      
      const authHeader = await testContext.auth.getAuthHeader(adminUser.id);
      
      const response = await testContext.request
        .delete(`/teams/${testContext.testTeam!.id}/invitations/${testContext.testInvitation!.id}`)
        .set(authHeader);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should return 404 for non-existent invitation', async () => {
      const authHeader = await testContext.auth.getAuthHeader(testContext.testUser!.id);
      const nonExistentInvitationId = uuidv4();
      
      const response = await testContext.request
        .delete(`/teams/${testContext.testTeam!.id}/invitations/${nonExistentInvitationId}`)
        .set(authHeader);
      
      expect(response.status).toBe(404);
    });
  });
}); 