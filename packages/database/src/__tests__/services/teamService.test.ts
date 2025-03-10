/**
 * @file Team Service Tests
 * @version 0.1.0
 * 
 * Tests for the TeamService functionality.
 */

import { testDb, setupTestDb, teardownTestDb } from '../setup';
import { TeamService } from '../../services/teamService';
import { TeamRole, SubscriptionTier } from '../../schema/teams';
import { v4 as uuidv4 } from 'uuid';

// Initialize the team service
const teamService = new TeamService();

// Test IDs for cleanup
const testIds = {
  teamIds: [] as string[],
  userIds: [] as string[]
};

// Set up and tear down
beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await testDb.cleanup(testIds);
  await teardownTestDb();
});

describe('TeamService', () => {
  describe('Team Creation', () => {
    test('should create a team with minimal information', async () => {
      // Create a test user
      const user = await testDb.createTestUser();
      testIds.userIds.push(user.id);
      
      // Create team with minimal info
      const teamName = testDb.uniqueName('minimal-team');
      const team = await teamService.createTeam({
        name: teamName,
        userId: user.id
      });
      
      // Add team ID for cleanup
      testIds.teamIds.push(team.id);
      
      // Assertions
      expect(team).toBeDefined();
      expect(team.name).toBe(teamName);
      expect(team.ownerId).toBe(user.id);
      expect(team.isPersonal).toBe(false);
      expect(team.subscriptionTier).toBe(SubscriptionTier.FREE);
      expect(team.slug).toBeDefined();
    });
    
    test('should create a team with complete information', async () => {
      // Create a test user
      const user = await testDb.createTestUser();
      testIds.userIds.push(user.id);
      
      // Create team with complete info
      const teamName = testDb.uniqueName('complete-team');
      const teamSlug = `complete-team-${Date.now()}`;
      const description = 'A complete team for testing';
      const logoUrl = 'https://example.com/logo.png';
      
      const team = await teamService.createTeam({
        name: teamName,
        slug: teamSlug,
        description,
        logoUrl,
        userId: user.id
      });
      
      // Add team ID for cleanup
      testIds.teamIds.push(team.id);
      
      // Assertions
      expect(team).toBeDefined();
      expect(team.name).toBe(teamName);
      expect(team.slug).toBe(teamSlug);
      expect(team.description).toBe(description);
      expect(team.logoUrl).toBe(logoUrl);
      expect(team.ownerId).toBe(user.id);
      expect(team.isPersonal).toBe(false);
    });
    
    test('should generate a unique slug if not provided', async () => {
      // Create a test user
      const user = await testDb.createTestUser();
      testIds.userIds.push(user.id);
      
      // Create team without a slug
      const teamName = 'Slug Test Team';
      const team = await teamService.createTeam({
        name: teamName,
        userId: user.id
      });
      
      // Add team ID for cleanup
      testIds.teamIds.push(team.id);
      
      // Assertions
      expect(team).toBeDefined();
      expect(team.slug).toBeDefined();
      expect(team.slug).toContain('slug-test-team');
    });
    
    test('should create a personal team', async () => {
      // Test within a transaction
      await testDb.withTransaction(async () => {
        // Create a test user
        const user = await testDb.createTestUser();
        
        // Try to create a personal team
        const teamName = `${user.fullName}'s Personal Team`;
        const team = await teamService.createTeam({
          name: teamName,
          userId: user.id,
          isPersonal: true
        });
        
        // Assertions
        expect(team).toBeDefined();
        expect(team.name).toBe(teamName);
        expect(team.ownerId).toBe(user.id);
        expect(team.isPersonal).toBe(true);
        
        // Not adding to testIds because transaction will be rolled back
      });
    });
  });

  describe('Team Retrieval', () => {
    let testTeam: any;
    let testUser: any;
    
    beforeAll(async () => {
      // Create a test user
      testUser = await testDb.createTestUser();
      testIds.userIds.push(testUser.id);
      
      // Create a test team
      const teamName = testDb.uniqueName('retrieval-team');
      testTeam = await teamService.createTeam({
        name: teamName,
        userId: testUser.id
      });
      testIds.teamIds.push(testTeam.id);
    });
    
    test('should retrieve a team by ID', async () => {
      // Get team by ID
      const team = await teamService.getTeamById(testTeam.id);
      
      // Assertions
      expect(team).toBeDefined();
      expect(team?.id).toBe(testTeam.id);
      expect(team?.name).toBe(testTeam.name);
    });
    
    test('should retrieve a team by slug', async () => {
      // Get team by slug
      const team = await teamService.getTeamBySlug(testTeam.slug);
      
      // Assertions
      expect(team).toBeDefined();
      expect(team?.id).toBe(testTeam.id);
      expect(team?.slug).toBe(testTeam.slug);
    });
    
    test('should retrieve user teams', async () => {
      // Get user teams
      const teams = await teamService.getUserTeams(testUser.id);
      
      // Assertions
      expect(teams).toBeDefined();
      expect(teams.length).toBeGreaterThanOrEqual(1);
      expect(teams.some(team => team.id === testTeam.id)).toBe(true);
    });
    
    test('should return null for non-existent team ID', async () => {
      // Get non-existent team
      const nonExistentId = uuidv4();
      const team = await teamService.getTeamById(nonExistentId);
      
      // Assertions
      expect(team).toBeNull();
    });
    
    test('should return null for non-existent team slug', async () => {
      // Get non-existent team
      const nonExistentSlug = `non-existent-${Date.now()}`;
      const team = await teamService.getTeamBySlug(nonExistentSlug);
      
      // Assertions
      expect(team).toBeNull();
    });
  });
}); 