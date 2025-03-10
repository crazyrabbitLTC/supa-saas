/**
 * @file Profile Controller
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Controller for profile-related operations.
 * 
 * IMPORTANT:
 * - Business logic for profiles should be here
 * - Keep routes focused on request/response handling
 * 
 * Functionality:
 * - Get profile by ID
 * - Update profile
 */

import { FastifyInstance } from 'fastify';
import { profiles, type Profile } from 'database';
import { eq } from 'drizzle-orm';

/**
 * Profile controller with methods for profile operations
 */
export const profileController = {
  /**
   * Get a profile by ID
   * @param fastify The Fastify instance
   * @param id The profile ID
   * @returns The profile or null if not found
   */
  async getProfileById(fastify: FastifyInstance, id: string): Promise<Profile | null> {
    try {
      const result = await fastify.db
        .select()
        .from(profiles)
        .where(eq(profiles.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      fastify.log.error(error, `Error getting profile with ID ${id}`);
      throw error;
    }
  },
  
  /**
   * Update a profile
   * @param fastify The Fastify instance
   * @param id The profile ID
   * @param data The profile data to update
   * @returns The updated profile
   */
  async updateProfile(
    fastify: FastifyInstance,
    id: string,
    data: Partial<Omit<Profile, 'id'>>
  ): Promise<Profile | null> {
    try {
      // Check if profile exists
      const existingProfile = await this.getProfileById(fastify, id);
      if (!existingProfile) {
        return null;
      }
      
      // Update profile
      const result = await fastify.db
        .update(profiles)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, id))
        .returning();
      
      return result[0] || null;
    } catch (error) {
      fastify.log.error(error, `Error updating profile with ID ${id}`);
      throw error;
    }
  },
}; 