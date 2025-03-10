/**
 * @file Profile Service
 * @version 0.2.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Service for managing user profiles using Supabase.
 * 
 * IMPORTANT:
 * - All operations respect RLS policies through the Supabase client
 * - Profile operations should be performed through this service
 * 
 * Functionality:
 * - Profile CRUD operations
 */

import { supabaseAdmin, supabaseClient } from '../client';
import { 
  Profile, ProfileRow, NewProfile, UpdateProfile,
  snakeToCamel, camelToSnake
} from '../types';

interface UpdateProfileParams {
  id: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  website?: string;
}

class ProfileService {
  /**
   * Get a profile by ID
   */
  async getProfileById(id: string): Promise<Profile | null> {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get profile: ${error.message}`);
    }
    
    return snakeToCamel(data) as Profile;
  }

  /**
   * Get a profile by username
   */
  async getProfileByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get profile by username: ${error.message}`);
    }
    
    return snakeToCamel(data) as Profile;
  }

  /**
   * Create a new profile
   */
  async createProfile(profile: NewProfile): Promise<Profile> {
    // Convert camelCase to snake_case
    const snakeCaseProfile = camelToSnake(profile);
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert(snakeCaseProfile)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`);
    }
    
    return snakeToCamel(data) as Profile;
  }

  /**
   * Update a profile
   */
  async updateProfile({ id, username, fullName, avatarUrl, website }: UpdateProfileParams): Promise<Profile | null> {
    const updates: Partial<ProfileRow> = {};
    
    if (username !== undefined) updates.username = username;
    if (fullName !== undefined) updates.full_name = fullName;
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
    if (website !== undefined) updates.website = website;
    
    updates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabaseClient
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
    
    return snakeToCamel(data) as Profile;
  }

  /**
   * Delete a profile
   */
  async deleteProfile(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete profile: ${error.message}`);
    }
    
    return true;
  }

  /**
   * Check if a username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return true; // Not found, so username is available
      }
      throw new Error(`Failed to check username availability: ${error.message}`);
    }
    
    return !data; // If data exists, username is not available
  }
}

export const profileService = new ProfileService(); 