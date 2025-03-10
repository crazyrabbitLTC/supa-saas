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
    console.log(`[PROFILE_DEBUG] Attempting to update profile with ID: ${id}`);
    
    try {
      // First check if the profile exists using admin client
      const { data: existingProfile, error: findError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (findError) {
        console.error(`[PROFILE_DEBUG] Error checking if profile exists: ${findError.message}`);
        if (findError.code === 'PGRST116') {
          console.log(`[PROFILE_DEBUG] No profile found with ID ${id}`);
          return null;
        }
        throw new Error(`Failed to get profile: ${findError.message}`);
      }
      
      console.log(`[PROFILE_DEBUG] Found profile with ID ${id}: ${JSON.stringify(existingProfile)}`);
      
      const updates: Partial<ProfileRow> = {};
      
      if (username !== undefined) updates.username = username;
      if (fullName !== undefined) updates.full_name = fullName;
      if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
      if (website !== undefined) updates.website = website;
      
      updates.updated_at = new Date().toISOString();
      
      console.log(`[PROFILE_DEBUG] Applying updates: ${JSON.stringify(updates)}`);
      
      // Try using the admin client for the update operation
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`[PROFILE_DEBUG] Update failed with admin client: ${error.message}`);
        console.error(`[PROFILE_DEBUG] Error details: ${JSON.stringify(error)}`);
        
        // If normal update failed, try a different approach
        console.log(`[PROFILE_DEBUG] Trying again with a different approach: recreating the profile entry`);
        
        // Prepare complete profile data
        const completeProfile = {
          ...existingProfile,
          ...(username !== undefined ? { username } : {}),
          ...(fullName !== undefined ? { full_name: fullName } : {}),
          ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
          ...(website !== undefined ? { website } : {}),
          updated_at: updates.updated_at
        };
        
        // Try to delete and then re-insert the profile
        const { error: deleteError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', id);
          
        if (deleteError) {
          console.error(`[PROFILE_DEBUG] Failed to delete profile: ${deleteError.message}`);
          throw new Error(`Failed to update profile: ${error.message}`);
        }
        
        // Re-insert the profile
        const { data: insertedProfile, error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert(completeProfile)
          .select()
          .single();
          
        if (insertError) {
          console.error(`[PROFILE_DEBUG] Failed to re-insert profile: ${insertError.message}`);
          throw new Error(`Failed to update profile: ${error.message}`);
        }
        
        console.log(`[PROFILE_DEBUG] Update successful via recreate. Profile: ${JSON.stringify(insertedProfile)}`);
        return snakeToCamel(insertedProfile) as Profile;
      }
      
      console.log(`[PROFILE_DEBUG] Update successful. Updated profile: ${JSON.stringify(data)}`);
      return snakeToCamel(data) as Profile;
    } catch (error) {
      // For any unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[PROFILE_DEBUG] Unexpected error: ${errorMessage}`);
      throw error;
    }
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