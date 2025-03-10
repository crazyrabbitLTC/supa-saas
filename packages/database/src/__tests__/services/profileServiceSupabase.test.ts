/**
 * @file Profile Service Tests
 * @version 0.1.0
 * 
 * Tests for the ProfileService functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import { profileService } from '../../services/profileService';
import { supabaseClient, supabaseAdmin } from '../../client';
import { snakeToCamel } from '../../types/helpers';

// Mock the snakeToCamel function
vi.mock('../../types/helpers', () => ({
  snakeToCamel: vi.fn(obj => obj),
  camelToSnake: vi.fn(obj => obj),
}));

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
  };
  
  return {
    supabaseClient: mockSupabaseClient,
    supabaseAdmin: mockSupabaseClient,
    getSupabaseClient: () => mockSupabaseClient,
    getSupabaseAdmin: () => mockSupabaseClient,
  };
});

describe('ProfileService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });
  
  describe('getProfileById', () => {
    it('should return a profile when found', async () => {
      // Mock data
      const profileId = uuidv4();
      const mockProfile = {
        id: profileId,
        username: 'testuser',
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.png',
        website: 'https://example.com',
        updated_at: new Date().toISOString(),
      };
      
      // Setup mocks
      vi.mocked(supabaseClient.from).mockReturnValue(supabaseClient);
      vi.mocked(supabaseClient.select).mockReturnValue(supabaseClient);
      vi.mocked(supabaseClient.eq).mockReturnValue(supabaseClient);
      vi.mocked(supabaseClient.single).mockResolvedValueOnce({ data: mockProfile, error: null });
      
      // Mock snakeToCamel to return expected format
      vi.mocked(snakeToCamel).mockImplementationOnce(() => ({
        id: profileId,
        username: 'testuser',
        fullName: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
        website: 'https://example.com',
        updatedAt: new Date().toISOString(),
      }));
      
      // Call the service
      const profile = await profileService.getProfileById(profileId);
      
      // Assertions
      expect(profile).toBeDefined();
      expect(profile?.id).toBe(profileId);
      expect(profile?.username).toBe('testuser');
      expect(profile?.fullName).toBe('Test User');
      
      // Verify Supabase calls
      expect(supabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(supabaseClient.select).toHaveBeenCalledWith('*');
      expect(supabaseClient.eq).toHaveBeenCalledWith('id', profileId);
    });
    
    it('should return null when profile not found', async () => {
      // Mock data
      const profileId = uuidv4();
      
      // Setup mocks
      vi.mocked(supabaseClient.from).mockReturnValue(supabaseClient);
      vi.mocked(supabaseClient.select).mockReturnValue(supabaseClient);
      vi.mocked(supabaseClient.eq).mockReturnValue(supabaseClient);
      vi.mocked(supabaseClient.single).mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      });
      
      // Call the service
      const profile = await profileService.getProfileById(profileId);
      
      // Assertions
      expect(profile).toBeNull();
      
      // Verify Supabase calls
      expect(supabaseClient.from).toHaveBeenCalledWith('profiles');
      expect(supabaseClient.select).toHaveBeenCalledWith('*');
      expect(supabaseClient.eq).toHaveBeenCalledWith('id', profileId);
    });
  });
  
  describe('createProfile', () => {
    it('should create a profile', async () => {
      // Mock data
      const profileId = uuidv4();
      const newProfile = {
        id: profileId,
        username: 'newuser',
        fullName: 'New User',
        avatarUrl: 'https://example.com/avatar.png',
        website: 'https://example.com',
      };
      
      const mockResponse = {
        id: profileId,
        username: 'newuser',
        full_name: 'New User',
        avatar_url: 'https://example.com/avatar.png',
        website: 'https://example.com',
        updated_at: new Date().toISOString(),
      };
      
      // Setup mocks
      vi.mocked(supabaseAdmin.from).mockReturnValue(supabaseAdmin);
      vi.mocked(supabaseAdmin.insert).mockReturnValue(supabaseAdmin);
      vi.mocked(supabaseAdmin.select).mockReturnValue(supabaseAdmin);
      vi.mocked(supabaseAdmin.single).mockResolvedValueOnce({ data: mockResponse, error: null });
      
      // Mock snakeToCamel to return expected format
      vi.mocked(snakeToCamel).mockImplementationOnce(() => ({
        id: profileId,
        username: 'newuser',
        fullName: 'New User',
        avatarUrl: 'https://example.com/avatar.png',
        website: 'https://example.com',
        updatedAt: new Date().toISOString(),
      }));
      
      // Call the service
      const profile = await profileService.createProfile(newProfile);
      
      // Assertions
      expect(profile).toBeDefined();
      expect(profile.id).toBe(profileId);
      expect(profile.username).toBe('newuser');
      expect(profile.fullName).toBe('New User');
      
      // Verify Supabase calls
      expect(supabaseAdmin.from).toHaveBeenCalledWith('profiles');
      expect(supabaseAdmin.insert).toHaveBeenCalledWith(expect.objectContaining({
        id: profileId,
        username: 'newuser',
      }));
    });
  });
}); 