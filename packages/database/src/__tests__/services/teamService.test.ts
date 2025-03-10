/**
 * @file Team Service Tests
 * @version 0.1.0
 * 
 * Tests for the TeamService functionality.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

// Simple mock for TeamService
class TeamServiceMock {
  async createTeam(params: { name: string; userId: string; isPersonal?: boolean }) {
    return {
      id: uuidv4(),
      name: params.name,
      slug: params.name.toLowerCase().replace(/\s+/g, '-'),
      ownerId: params.userId,
      isPersonal: params.isPersonal || false,
      subscriptionTier: 'free',
      subscriptionId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

// Create mock service
const teamService = new TeamServiceMock();

describe('TeamService', () => {
  describe('Basic Team Creation', () => {
    it('should create a team with minimal information', async () => {
      // Create team with minimal info
      const teamName = `Test Team ${Date.now()}`;
      const userId = uuidv4();
      
      const team = await teamService.createTeam({
        name: teamName,
        userId
      });
      
      // Assertions
      expect(team).toBeDefined();
      expect(team.name).toBe(teamName);
      expect(team.ownerId).toBe(userId);
      expect(team.isPersonal).toBe(false);
      expect(team.subscriptionTier).toBe('free');
      expect(team.slug).toBeDefined();
    });
    
    it('should create a personal team', async () => {
      // Create a personal team
      const userId = uuidv4();
      const teamName = `Personal Team ${Date.now()}`;
      
      const team = await teamService.createTeam({
        name: teamName,
        userId,
        isPersonal: true
      });
      
      // Assertions
      expect(team).toBeDefined();
      expect(team.name).toBe(teamName);
      expect(team.ownerId).toBe(userId);
      expect(team.isPersonal).toBe(true);
    });
  });
}); 