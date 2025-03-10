/**
 * @file Teams Endpoints Integration Tests
 * @version 0.1.0
 * 
 * Integration tests for the teams API endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { initTestServer } from '../setup/testServer';
import { v4 as uuidv4 } from 'uuid';

describe('Teams Endpoints', () => {
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

  describe('GET /teams', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await testContext.request.get('/teams');
      expect(response.status).toBe(401);
    });

    it('should return empty array if user has no teams', async () => {
      const authHeader = await testContext.auth.getAuthHeader(testContext.testUser!.id);
      
      const response = await testContext.request
        .get('/teams')
        .set(authHeader);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return user teams', async () => {
      const userId = testContext.testUser!.id;
      const authHeader = await testContext.auth.getAuthHeader(userId);
      
      // Create a team for the user
      testContext.testTeam = await testContext.auth.createTestTeam(userId, {
        name: `Test Team ${Date.now()}`
      });
      
      const response = await testContext.request
        .get('/teams')
        .set(authHeader);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(testContext.testTeam.id);
      expect(response.body[0].name).toBe(testContext.testTeam.name);
      expect(response.body[0].ownerId).toBe(userId);
    });
  });

  describe('POST /teams', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await testContext.request
        .post('/teams')
        .send({ name: 'New Team' });
      
      expect(response.status).toBe(401);
    });

    it('should create a new team', async () => {
      const userId = testContext.testUser!.id;
      const authHeader = await testContext.auth.getAuthHeader(userId);
      const teamName = `New Team ${Date.now()}`;
      
      const response = await testContext.request
        .post('/teams')
        .set(authHeader)
        .send({ name: teamName });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', teamName);
      expect(response.body).toHaveProperty('ownerId', userId);
      expect(response.body).toHaveProperty('slug');
      expect(response.body).toHaveProperty('subscriptionTier', 'free');
      expect(response.body).toHaveProperty('isPersonal', false);
      
      // Verify team was created in database
      const teamsResponse = await testContext.request
        .get('/teams')
        .set(authHeader);
      
      expect(teamsResponse.body.some((team: any) => team.id === response.body.id)).toBe(true);
    });

    it('should create a team with optional fields', async () => {
      const userId = testContext.testUser!.id;
      const authHeader = await testContext.auth.getAuthHeader(userId);
      const teamData = {
        name: `Detailed Team ${Date.now()}`,
        slug: `detailed-team-${Date.now()}`,
        description: 'A team with all optional fields',
        logoUrl: 'https://example.com/logo.png'
      };
      
      const response = await testContext.request
        .post('/teams')
        .set(authHeader)
        .send(teamData);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', teamData.name);
      expect(response.body).toHaveProperty('slug', teamData.slug);
      expect(response.body).toHaveProperty('description', teamData.description);
      expect(response.body).toHaveProperty('logoUrl', teamData.logoUrl);
    });

    it('should return 400 for invalid team data', async () => {
      const userId = testContext.testUser!.id;
      const authHeader = await testContext.auth.getAuthHeader(userId);
      
      // Missing required name field
      const response = await testContext.request
        .post('/teams')
        .set(authHeader)
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /teams/:id', () => {
    it('should return 401 if not authenticated', async () => {
      const fakeTeamId = uuidv4();
      const response = await testContext.request.get(`/teams/${fakeTeamId}`);
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent team', async () => {
      const userId = testContext.testUser!.id;
      const authHeader = await testContext.auth.getAuthHeader(userId);
      const nonExistentTeamId = uuidv4();
      
      const response = await testContext.request
        .get(`/teams/${nonExistentTeamId}`)
        .set(authHeader);
      
      expect(response.status).toBe(404);
    });

    it('should return team details for team member', async () => {
      const userId = testContext.testUser!.id;
      const authHeader = await testContext.auth.getAuthHeader(userId);
      
      // Create a team for the user
      const team = await testContext.auth.createTestTeam(userId);
      
      const response = await testContext.request
        .get(`/teams/${team.id}`)
        .set(authHeader);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', team.id);
      expect(response.body).toHaveProperty('name', team.name);
      expect(response.body).toHaveProperty('ownerId', userId);
    });

    it('should return 403 for team user is not a member of', async () => {
      // Create two users
      const user1 = await testContext.auth.createTestUser();
      const user2 = await testContext.auth.createTestUser();
      
      // Create a team for user1
      const team = await testContext.auth.createTestTeam(user1.id);
      
      // Try to access as user2
      const authHeader = await testContext.auth.getAuthHeader(user2.id);
      
      const response = await testContext.request
        .get(`/teams/${team.id}`)
        .set(authHeader);
      
      expect(response.status).toBe(403);
    });
  });

  describe('PUT /teams/:id', () => {
    it('should return 401 if not authenticated', async () => {
      const fakeTeamId = uuidv4();
      const response = await testContext.request
        .put(`/teams/${fakeTeamId}`)
        .send({ name: 'Updated Team' });
      
      expect(response.status).toBe(401);
    });

    it('should update team details as owner', async () => {
      const userId = testContext.testUser!.id;
      const authHeader = await testContext.auth.getAuthHeader(userId);
      
      // Create a team for the user
      const team = await testContext.auth.createTestTeam(userId);
      
      const updatedData = {
        name: `Updated Team ${Date.now()}`,
        description: 'Updated description',
        logoUrl: 'https://example.com/updated-logo.png'
      };
      
      const response = await testContext.request
        .put(`/teams/${team.id}`)
        .set(authHeader)
        .send(updatedData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', team.id);
      expect(response.body).toHaveProperty('name', updatedData.name);
      expect(response.body).toHaveProperty('description', updatedData.description);
      expect(response.body).toHaveProperty('logoUrl', updatedData.logoUrl);
    });

    it('should return 403 for non-admin team member', async () => {
      // Create two users
      const ownerUser = await testContext.auth.createTestUser();
      const memberUser = await testContext.auth.createTestUser();
      
      // Create a team for the owner
      const team = await testContext.auth.createTestTeam(ownerUser.id);
      
      // Add the second user as a regular member
      await testContext.auth.addTeamMember(team.id, memberUser.id, 'member');
      
      // Try to update as regular member
      const authHeader = await testContext.auth.getAuthHeader(memberUser.id);
      
      const response = await testContext.request
        .put(`/teams/${team.id}`)
        .set(authHeader)
        .send({ name: 'Unauthorized Update' });
      
      expect(response.status).toBe(403);
    });

    it('should allow admin to update team details', async () => {
      // Create two users
      const ownerUser = await testContext.auth.createTestUser();
      const adminUser = await testContext.auth.createTestUser();
      
      // Create a team for the owner
      const team = await testContext.auth.createTestTeam(ownerUser.id);
      
      // Add the second user as an admin
      await testContext.auth.addTeamMember(team.id, adminUser.id, 'admin');
      
      // Update as admin
      const authHeader = await testContext.auth.getAuthHeader(adminUser.id);
      
      const updatedData = {
        name: `Admin Updated Team ${Date.now()}`
      };
      
      const response = await testContext.request
        .put(`/teams/${team.id}`)
        .set(authHeader)
        .send(updatedData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', updatedData.name);
    });
  });

  describe('DELETE /teams/:id', () => {
    it('should return 401 if not authenticated', async () => {
      const fakeTeamId = uuidv4();
      const response = await testContext.request.delete(`/teams/${fakeTeamId}`);
      expect(response.status).toBe(401);
    });

    it('should delete team as owner', async () => {
      const userId = testContext.testUser!.id;
      const authHeader = await testContext.auth.getAuthHeader(userId);
      
      // Create a team for the user
      const team = await testContext.auth.createTestTeam(userId, { isPersonal: false });
      
      const response = await testContext.request
        .delete(`/teams/${team.id}`)
        .set(authHeader);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      
      // Verify team was deleted
      const getResponse = await testContext.request
        .get(`/teams/${team.id}`)
        .set(authHeader);
      
      expect(getResponse.status).toBe(404);
    });

    it('should return 403 for non-owner team member', async () => {
      // Create two users
      const ownerUser = await testContext.auth.createTestUser();
      const memberUser = await testContext.auth.createTestUser();
      
      // Create a team for the owner
      const team = await testContext.auth.createTestTeam(ownerUser.id);
      
      // Add the second user as an admin
      await testContext.auth.addTeamMember(team.id, memberUser.id, 'admin');
      
      // Try to delete as admin (not owner)
      const authHeader = await testContext.auth.getAuthHeader(memberUser.id);
      
      const response = await testContext.request
        .delete(`/teams/${team.id}`)
        .set(authHeader);
      
      expect(response.status).toBe(403);
    });

    it('should prevent deletion of personal team', async () => {
      const userId = testContext.testUser!.id;
      const authHeader = await testContext.auth.getAuthHeader(userId);
      
      // Create a personal team for the user
      const team = await testContext.auth.createTestTeam(userId, { isPersonal: true });
      
      const response = await testContext.request
        .delete(`/teams/${team.id}`)
        .set(authHeader);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('personal team');
    });
  });

  describe('GET /teams/:id/members', () => {
    it('should return 401 if not authenticated', async () => {
      const fakeTeamId = uuidv4();
      const response = await testContext.request.get(`/teams/${fakeTeamId}/members`);
      expect(response.status).toBe(401);
    });

    it('should return team members', async () => {
      const userId = testContext.testUser!.id;
      const authHeader = await testContext.auth.getAuthHeader(userId);
      
      // Create a team for the user
      const team = await testContext.auth.createTestTeam(userId);
      
      // Add another member
      const member = await testContext.auth.createTestUser();
      await testContext.auth.addTeamMember(team.id, member.id, 'member');
      
      const response = await testContext.request
        .get(`/teams/${team.id}/members`)
        .set(authHeader);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      
      // Check for owner
      const ownerMember = response.body.find((m: any) => m.userId === userId);
      expect(ownerMember).toBeDefined();
      expect(ownerMember.role).toBe('owner');
      
      // Check for regular member
      const regularMember = response.body.find((m: any) => m.userId === member.id);
      expect(regularMember).toBeDefined();
      expect(regularMember.role).toBe('member');
    });

    it('should return 403 for non-member', async () => {
      // Create two users
      const ownerUser = await testContext.auth.createTestUser();
      const nonMemberUser = await testContext.auth.createTestUser();
      
      // Create a team for the owner
      const team = await testContext.auth.createTestTeam(ownerUser.id);
      
      // Try to access as non-member
      const authHeader = await testContext.auth.getAuthHeader(nonMemberUser.id);
      
      const response = await testContext.request
        .get(`/teams/${team.id}/members`)
        .set(authHeader);
      
      expect(response.status).toBe(403);
    });
  });

  describe('POST /teams/:id/invitations', () => {
    it('should return 401 if not authenticated', async () => {
      const fakeTeamId = uuidv4();
      const response = await testContext.request
        .post(`/teams/${fakeTeamId}/invitations`)
        .send({ email: 'test@example.com', role: 'member' });
      
      expect(response.status).toBe(401);
    });

    it('should create team invitation as owner', async () => {
      const userId = testContext.testUser!.id;
      const authHeader = await testContext.auth.getAuthHeader(userId);
      
      // Create a team for the user
      const team = await testContext.auth.createTestTeam(userId);
      
      const inviteEmail = `invite-${Date.now()}@example.com`;
      
      const response = await testContext.request
        .post(`/teams/${team.id}/invitations`)
        .set(authHeader)
        .send({ email: inviteEmail, role: 'member' });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('teamId', team.id);
      expect(response.body).toHaveProperty('email', inviteEmail);
      expect(response.body).toHaveProperty('role', 'member');
      expect(response.body).toHaveProperty('invitedBy', userId);
      expect(response.body).toHaveProperty('token');
    });

    it('should return 403 for non-admin team member', async () => {
      // Create two users
      const ownerUser = await testContext.auth.createTestUser();
      const memberUser = await testContext.auth.createTestUser();
      
      // Create a team for the owner
      const team = await testContext.auth.createTestTeam(ownerUser.id);
      
      // Add the second user as a regular member
      await testContext.auth.addTeamMember(team.id, memberUser.id, 'member');
      
      // Try to invite as regular member
      const authHeader = await testContext.auth.getAuthHeader(memberUser.id);
      
      const response = await testContext.request
        .post(`/teams/${team.id}/invitations`)
        .set(authHeader)
        .send({ email: 'test@example.com', role: 'member' });
      
      expect(response.status).toBe(403);
    });

    it('should allow admin to create invitation', async () => {
      // Create two users
      const ownerUser = await testContext.auth.createTestUser();
      const adminUser = await testContext.auth.createTestUser();
      
      // Create a team for the owner
      const team = await testContext.auth.createTestTeam(ownerUser.id);
      
      // Add the second user as an admin
      await testContext.auth.addTeamMember(team.id, adminUser.id, 'admin');
      
      // Invite as admin
      const authHeader = await testContext.auth.getAuthHeader(adminUser.id);
      
      const inviteEmail = `admin-invite-${Date.now()}@example.com`;
      
      const response = await testContext.request
        .post(`/teams/${team.id}/invitations`)
        .set(authHeader)
        .send({ email: inviteEmail, role: 'member' });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('email', inviteEmail);
      expect(response.body).toHaveProperty('invitedBy', adminUser.id);
    });
  });

  describe('GET /teams/:id/invitations', () => {
    it('should return 401 if not authenticated', async () => {
      const fakeTeamId = uuidv4();
      const response = await testContext.request.get(`/teams/${fakeTeamId}/invitations`);
      expect(response.status).toBe(401);
    });

    it('should return team invitations', async () => {
      const userId = testContext.testUser!.id;
      const authHeader = await testContext.auth.getAuthHeader(userId);
      
      // Create a team for the user
      const team = await testContext.auth.createTestTeam(userId);
      
      // Create invitations
      const inviteEmail1 = `invite1-${Date.now()}@example.com`;
      const inviteEmail2 = `invite2-${Date.now()}@example.com`;
      
      await testContext.auth.createTeamInvitation(team.id, inviteEmail1, userId);
      await testContext.auth.createTeamInvitation(team.id, inviteEmail2, userId);
      
      const response = await testContext.request
        .get(`/teams/${team.id}/invitations`)
        .set(authHeader);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      
      // Check invitations
      const emails = response.body.map((inv: any) => inv.email);
      expect(emails).toContain(inviteEmail1);
      expect(emails).toContain(inviteEmail2);
    });

    it('should return 403 for non-member', async () => {
      // Create two users
      const ownerUser = await testContext.auth.createTestUser();
      const nonMemberUser = await testContext.auth.createTestUser();
      
      // Create a team for the owner
      const team = await testContext.auth.createTestTeam(ownerUser.id);
      
      // Try to access as non-member
      const authHeader = await testContext.auth.getAuthHeader(nonMemberUser.id);
      
      const response = await testContext.request
        .get(`/teams/${team.id}/invitations`)
        .set(authHeader);
      
      expect(response.status).toBe(403);
    });
  });

  describe('GET /teams/subscription-tiers', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await testContext.request.get('/teams/subscription-tiers');
      expect(response.status).toBe(401);
    });

    it('should return all subscription tiers when authenticated', async () => {
      const userId = testContext.testUser!.id;
      const authHeader = await testContext.auth.getAuthHeader(userId);
      
      const response = await testContext.request
        .get('/teams/subscription-tiers')
        .set(authHeader);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      
      // Check that we have the expected tiers
      const tierNames = response.body.map((tier: any) => tier.name);
      expect(tierNames).toContain('free');
      expect(tierNames).toContain('basic');
      expect(tierNames).toContain('pro');
      expect(tierNames).toContain('enterprise');
      
      // Check tier structure
      const freeTier = response.body.find((tier: any) => tier.name === 'free');
      expect(freeTier).toHaveProperty('id');
      expect(freeTier).toHaveProperty('maxMembers');
      expect(freeTier).toHaveProperty('priceMonthly');
      expect(freeTier).toHaveProperty('priceYearly');
      expect(freeTier).toHaveProperty('features');
      expect(Array.isArray(freeTier.features)).toBe(true);
    });
  });
}); 