/**
 * @file Authentication Plugin
 * @version 0.1.0
 * @status DRAFT
 * @lastModified 2024-03-10
 * 
 * Fastify plugin for authentication with Supabase.
 * 
 * IMPORTANT:
 * - This plugin adds authentication middleware to the Fastify instance
 * - Use this plugin to protect routes that require authentication
 * 
 * Functionality:
 * - Verifies JWT tokens from Supabase
 * - Adds user information to the request object
 * - Provides a decorator for protecting routes
 */

import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

// Extend FastifyInstance type to include authenticate method
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  
  interface FastifyRequest {
    user?: {
      id: string;
      email?: string;
      role?: string;
      [key: string]: any;
    };
  }
}

/**
 * Plugin that adds authentication middleware to the Fastify instance
 * @param fastify The Fastify instance
 */
const authPluginAsync: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Authentication middleware
  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Check if Authorization header exists
      if (!request.headers.authorization) {
        return reply.status(401).send({ error: 'Unauthorized: Missing token' });
      }
      
      // Extract token from Authorization header
      const token = request.headers.authorization.replace('Bearer ', '');
      
      // Verify token with Supabase
      const { data, error } = await fastify.supabase.auth.getUser(token);
      
      if (error || !data.user) {
        fastify.log.error({ error }, 'Authentication failed');
        return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
      }
      
      // Set user on request
      request.user = data.user;
      
    } catch (err) {
      fastify.log.error({ err }, 'Authentication error');
      return reply.status(401).send({ error: 'Unauthorized: Authentication failed' });
    }
  };
  
  // Add authenticate method to Fastify instance
  fastify.decorate('authenticate', authenticate);
  
  // Log that the auth plugin is registered
  fastify.log.info('Authentication plugin registered');
};

// Export the plugin
export const authPlugin = fp(authPluginAsync, {
  name: 'auth',
  dependencies: ['database'],
}); 