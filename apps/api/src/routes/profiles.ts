/**
 * @file Profile Routes
 * @version 0.2.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * API routes for user profiles.
 * 
 * IMPORTANT:
 * - These routes handle profile management
 * - Authentication is required for most endpoints
 * 
 * Functionality:
 * - Get profile by ID
 * - Get current user's profile
 * - Update profile
 */

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { profileService } from 'database';
import { profileController } from '../controllers/profile-controller';

// Schema for profile parameters
const profileParamsSchema = z.object({
  id: z.string().uuid(),
});

// Schema for profile update
const profileUpdateSchema = z.object({
  username: z.string().min(3).optional(),
  fullName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  website: z.string().url().optional(),
});

/**
 * Profile routes
 * @param fastify The Fastify instance
 */
export const profileRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get profile by ID
  fastify.get<{ Params: z.infer<typeof profileParamsSchema> }>(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' }
          },
          required: ['id']
        }
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      
      // Get profile from database
      const profile = await profileController.getProfileById(fastify, id);
      
      if (!profile) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Profile not found',
        });
      }
      
      return profile;
    }
  );
  
  // Get current user's profile
  fastify.get('/me', {
    onRequest: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      
      // Get profile from database
      const profile = await profileController.getProfileById(fastify, userId);
      
      if (!profile) {
        // If profile doesn't exist, create a new one
        const newProfile = {
          id: userId,
          username: `user-${userId.substring(0, 8)}`,
          fullName: '',
          avatarUrl: '',
          website: '',
        };
        
        // Create the new profile using the profile service
        const createdProfile = await profileService.createProfile(newProfile);
        return createdProfile;
      }
      
      return profile;
    } catch (error) {
      request.log.error(error, 'Error getting current user profile');
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to get profile',
      });
    }
  });
  
  // Update profile
  fastify.patch<{
    Params: z.infer<typeof profileParamsSchema>;
    Body: z.infer<typeof profileUpdateSchema>;
  }>(
    '/:id',
    {
      onRequest: fastify.authenticate,
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' }
          },
          required: ['id']
        },
        body: {
          type: 'object',
          properties: {
            username: { type: 'string', minLength: 3 },
            fullName: { type: 'string' },
            avatarUrl: { type: 'string', format: 'uri' },
            website: { type: 'string', format: 'uri' }
          }
        }
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const updateData = request.body;
      const userId = request.user.id;
      
      // Check if user is updating their own profile
      if (id !== userId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'You can only update your own profile',
        });
      }
      
      // Update profile
      const updatedProfile = await profileController.updateProfile(fastify, id, updateData);
      
      if (!updatedProfile) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Profile not found',
        });
      }
      
      return updatedProfile;
    }
  );
}; 