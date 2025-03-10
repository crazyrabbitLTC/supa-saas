/**
 * @file Team Flow Integration Tests
 * @version 0.1.0
 * 
 * Integration tests for complete team workflows.
 */

import { initTestServer, testData, routes } from '../helpers/testUtils';
import { TeamRole } from '../../../../../packages/database/src/schema/teams';

// Test IDs for cleanup
const testIds = {
  teamIds: [] as string[],
  userIds: [] as string[],
  invitationIds: [] as string[]
};

describe('Team Flow Integration', () => {
  let server: any;
  let request: any;
  let auth: any;
  let cleanup: any;
  
  // Test users
  let owner: any;
  let admin: any;
  let member: any;
  let nonMember: any;
  
  // Auth headers
  let ownerAuth: any;
  let adminAuth: any;
  let memberAuth: any;
  let nonMemberAuth: any;
  
  // Test team
  let teamId: string;

  beforeAll(async () => {
    // Initialize test server
    const setup = await initTestServer();
    server = setup.server;
    request = setup.request;
    auth = setup.auth;
    cleanup = setup.cleanup;
    
    // Create test users with different roles
    owner = await auth.createTestUser({ fullName: 'Test Owner' });
    admin = await auth.createTestUser({ fullName: 'Test Admin' });
    member = await auth.createTestUser({ fullName: 'Test Member' });
    nonMember = await auth.createTestUser({ fullName: 'Test Non-Member' });
    
    // Save user IDs for cleanup
    testIds.userIds.push(owner.id, admin.id, member.id, nonMember.id);
    
    // Get auth headers for each user
    ownerAuth = await auth.getAuthHeader(owner.id);
    adminAuth = await auth.getAuthHeader(admin.id);
    memberAuth = await auth.getAuthHeader(member.id);
    nonMemberAuth = await auth.getAuthHeader(nonMember.id);
  });

  afterAll(async () => {
    // Clean up test data
    await cleanup(testIds);
  });
  
  describe('Complete Team Lifecycle', () => {
    test('1. Owner creates a team', async () => {
      // Create team data
      const teamData = testData.createTeamPayload({
        teamName: 'Integration Test Team'
      });
      
      // Create the team as owner
      const response = await request
        .post(routes.teams.base)
        .set(ownerAuth)
        .send(teamData);
      
      // Save team ID for later tests and cleanup
      teamId = response.body.data.id;
      testIds.teamIds.push(teamId);
      
      // Assertions
      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe(teamData.name);
      expect(response.body.data.ownerId).toBe(owner.id);
    });
    
    test('2. Owner adds members with different roles', async () => {
      // Add admin user
      const adminResponse = await request
        .post(routes.teams.members(teamId))
        .set(ownerAuth)
        .send({
          userId: admin.id,
          role: TeamRole.ADMIN
        });
      
      // Add regular member
      const memberResponse = await request
        .post(routes.teams.members(teamId))
        .set(ownerAuth)
        .send({
          userId: member.id,
          role: TeamRole.MEMBER
        });
      
      // Assertions
      expect(adminResponse.status).toBe(201);
      expect(adminResponse.body.data.userId).toBe(admin.id);
      expect(adminResponse.body.data.role).toBe(TeamRole.ADMIN);
      
      expect(memberResponse.status).toBe(201);
      expect(memberResponse.body.data.userId).toBe(member.id);
      expect(memberResponse.body.data.role).toBe(TeamRole.MEMBER);
    });
    
    test('3. Get team members', async () => {
      // Get team members
      const response = await request
        .get(routes.teams.members(teamId))
        .set(ownerAuth);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(3); // Owner, admin, and member
      
      // Verify each member
      const members = response.body.data;
      expect(members.some((m: any) => m.userId === owner.id && m.role === TeamRole.OWNER)).toBe(true);
      expect(members.some((m: any) => m.userId === admin.id && m.role === TeamRole.ADMIN)).toBe(true);
      expect(members.some((m: any) => m.userId === member.id && m.role === TeamRole.MEMBER)).toBe(true);
    });
    
    test('4. Admin can update team details', async () => {
      // Update team as admin
      const updateData = testData.updateTeamPayload({
        teamName: 'Updated by Admin'
      });
      
      const response = await request
        .put(routes.teams.byId(teamId))
        .set(adminAuth)
        .send(updateData);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(updateData.name);
    });
    
    test('5. Regular member cannot update team details', async () => {
      // Try to update team as regular member
      const updateData = testData.updateTeamPayload({
        teamName: 'Updated by Member'
      });
      
      const response = await request
        .put(routes.teams.byId(teamId))
        .set(memberAuth)
        .send(updateData);
      
      // Assertions - should not be allowed
      expect(response.status).toBe(403);
    });
    
    test('6. Non-member cannot access team data', async () => {
      // Try to access team as non-member
      const response = await request
        .get(routes.teams.byId(teamId))
        .set(nonMemberAuth);
      
      // Assertions - should not be allowed
      expect(response.status).toBe(403);
    });
    
    test('7. Admin can add new members', async () => {
      // Create a temporary user
      const tempUser = await auth.createTestUser({ fullName: 'Temp User' });
      testIds.userIds.push(tempUser.id);
      
      // Add user as admin
      const response = await request
        .post(routes.teams.members(teamId))
        .set(adminAuth)
        .send({
          userId: tempUser.id,
          role: TeamRole.MEMBER
        });
      
      // Assertions
      expect(response.status).toBe(201);
      expect(response.body.data.userId).toBe(tempUser.id);
      expect(response.body.data.role).toBe(TeamRole.MEMBER);
    });
    
    test('8. Regular member cannot add new members', async () => {
      // Create a temporary user
      const tempUser = await auth.createTestUser({ fullName: 'Another Temp User' });
      testIds.userIds.push(tempUser.id);
      
      // Try to add user as regular member
      const response = await request
        .post(routes.teams.members(teamId))
        .set(memberAuth)
        .send({
          userId: tempUser.id,
          role: TeamRole.MEMBER
        });
      
      // Assertions - should not be allowed
      expect(response.status).toBe(403);
    });
    
    test('9. Owner can update member roles', async () => {
      // Update member to admin
      const response = await request
        .put(routes.teams.member(teamId, member.id))
        .set(ownerAuth)
        .send({
          role: TeamRole.ADMIN
        });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.data.userId).toBe(member.id);
      expect(response.body.data.role).toBe(TeamRole.ADMIN);
    });
    
    test('10. Admin cannot change owner role', async () => {
      // Try to change owner's role
      const response = await request
        .put(routes.teams.member(teamId, owner.id))
        .set(adminAuth)
        .send({
          role: TeamRole.ADMIN
        });
      
      // Assertions - should not be allowed
      expect(response.status).toBe(403);
    });
    
    test('11. Owner can remove members', async () => {
      // Remove admin member
      const response = await request
        .delete(routes.teams.member(teamId, admin.id))
        .set(ownerAuth);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify member was removed
      const getMembersResponse = await request
        .get(routes.teams.members(teamId))
        .set(ownerAuth);
      
      const members = getMembersResponse.body.data;
      expect(members.some((m: any) => m.userId === admin.id)).toBe(false);
    });
    
    test('12. Owner cannot be removed', async () => {
      // Try to remove owner (by admin who is now member after role update)
      const response = await request
        .delete(routes.teams.member(teamId, owner.id))
        .set(memberAuth); // Previously updated to admin in test 9
      
      // Assertions - should not be allowed
      expect(response.status).toBe(403);
    });
    
    test('13. Owner can delete the team', async () => {
      // Delete team
      const response = await request
        .delete(routes.teams.byId(teamId))
        .set(ownerAuth);
      
      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify team is deleted
      const getResponse = await request
        .get(routes.teams.byId(teamId))
        .set(ownerAuth);
      
      expect(getResponse.status).toBe(404);
      
      // No need to add to testIds since we're already cleaning up
    });
  });
}); 