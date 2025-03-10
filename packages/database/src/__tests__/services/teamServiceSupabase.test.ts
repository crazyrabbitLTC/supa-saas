/**
 * @file Team Service Supabase Tests
 * @version 0.1.0
 * 
 * Tests for the TeamServiceSupabase functionality.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { teamServiceSupabase } from '../../services/teamServiceSupabase';
import { supabaseClient, supabaseAdmin } from '../../client';

// Mock Supabase client
vi.mock('../../client', () => {
  const mockSupabaseClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
  };
  
  return {
    supabaseClient: mockSupabaseClient,
    supabaseAdmin: mockSupabaseClient,
  };
});

describe('TeamServiceSupabase', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });
  
  describe('createTeam', () => {
    it('should create a team with minimal information', async () => {
      // Mock data
      const teamName = `Test Team ${Date.now()}`;
      const userId = uuidv4();
      const teamId = uuidv4();
      
      // Mock Supabase responses
      const mockTeam = {
        id: teamId,
        name: teamName,
        slug: teamName.toLowerCase().replace(/\s+/g, '-'),
        is_personal: false,
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Setup mocks
      vi.mocked(supabaseAdmin.from).mockReturnValue(supabaseAdmin);
      vi.mocked(supabaseAdmin.insert).mockReturnValue(supabaseAdmin);
      vi.mocked(supabaseAdmin.select).mockReturnValue(supabaseAdmin);
      vi.mocked(supabaseAdmin.single).mockResolvedValueOnce({ data: mockTeam, error: null });
      vi.mocked(supabaseAdmin.eq).mockReturnValue(supabaseAdmin);
      
      // Second call for adding team member
      vi.mocked(supabaseAdmin.single).mockResolvedValueOnce({ data: null, error: null });
      
      // Call the service
      const team = await teamServiceSupabase.createTeam({
        name: teamName,
        userId,
      });
      
      // Assertions
      expect(team).toBeDefined();
      expect(team.name).toBe(teamName);
      expect(team.isPersonal).toBe(false);
      expect(team.subscriptionTier).toBe('free');
      
      // Verify Supabase calls
      expect(supabaseAdmin.from).toHaveBeenCalledWith('teams');
      expect(supabaseAdmin.insert).toHaveBeenCalledWith({
        name: teamName,
        slug: expect.any(String),
        description: undefined,
        logo_url: undefined,
        is_personal: false,
        subscription_tier: 'free',
      });
      
      // Verify team member creation
      expect(supabaseAdmin.from).toHaveBeenCalledWith('team_members');
      expect(supabaseAdmin.insert).toHaveBeenCalledWith({
        team_id: teamId,
        user_id: userId,
        role: 'owner',
      });
    });
  });
  
  describe('getTeamById', () => {
    it('should return a team when found', async () => {
      // Mock data
      const teamId = uuidv4();
      const mockTeam = {
        id: teamId,
        name: 'Test Team',
        slug: 'test-team',
        is_personal: false,
        subscription_tier: 'free',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Setup mocks
      vi.mocked(supabaseClient.from).mockReturnValue(supabaseClient);
      vi.mocked(supabaseClient.select).mockReturnValue(supabaseClient);
      vi.mocked(supabaseClient.eq).mockReturnValue(supabaseClient);
      vi.mocked(supabaseClient.single).mockResolvedValueOnce({ data: mockTeam, error: null });
      
      // Call the service
      const team = await teamServiceSupabase.getTeamById(teamId);
      
      // Assertions
      expect(team).toBeDefined();
      expect(team?.id).toBe(teamId);
      expect(team?.name).toBe('Test Team');
      
      // Verify Supabase calls
      expect(supabaseClient.from).toHaveBeenCalledWith('teams');
      expect(supabaseClient.select).toHaveBeenCalledWith('*');
      expect(supabaseClient.eq).toHaveBeenCalledWith('id', teamId);
    });
    
    it('should return null when team not found', async () => {
      // Mock data
      const teamId = uuidv4();
      
      // Setup mocks
      vi.mocked(supabaseClient.from).mockReturnValue(supabaseClient);
      vi.mocked(supabaseClient.select).mockReturnValue(supabaseClient);
      vi.mocked(supabaseClient.eq).mockReturnValue(supabaseClient);
      vi.mocked(supabaseClient.single).mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      });
      
      // Call the service
      const team = await teamServiceSupabase.getTeamById(teamId);
      
      // Assertions
      expect(team).toBeNull();
      
      // Verify Supabase calls
      expect(supabaseClient.from).toHaveBeenCalledWith('teams');
      expect(supabaseClient.select).toHaveBeenCalledWith('*');
      expect(supabaseClient.eq).toHaveBeenCalledWith('id', teamId);
    });
  });
}); 