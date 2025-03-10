/**
 * @file Profile Routes
 * @version 0.1.0
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
import { profiles } from 'database';
import { eq } from 'drizzle-orm';
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
        params: profileParamsSchema,
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
  fastify.get('/me', async (request, reply) => {
    // This would normally check the authentication token
    // For now, we'll return a 401 as a placeholder
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    
    // Once authentication is implemented:
    // const userId = request.user.id;
    // return profileController.getProfileById(fastify, userId);
  });
  
  // Update profile
  fastify.patch<{
    Params: z.infer<typeof profileParamsSchema>;
    Body: z.infer<typeof profileUpdateSchema>;
  }>(
    '/:id',
    {
      schema: {
        params: profileParamsSchema,
        body: profileUpdateSchema,
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const updateData = request.body;
      
      // This would normally check authorization
      // For now, we'll return a 401 as a placeholder
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      
      // Once authentication is implemented:
      // return profileController.updateProfile(fastify, id, updateData);
    }
  );
}; 