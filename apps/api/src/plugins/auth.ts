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
        fastify.log.info('Authentication failed: Missing authorization header');
        return reply.status(401).send({ error: 'Unauthorized: Missing token' });
      }
      
      // Extract token from Authorization header
      const authHeader = request.headers.authorization;
      fastify.log.debug(`Auth header format: ${authHeader.substring(0, 20)}...`);
      
      const token = authHeader.replace('Bearer ', '');
      fastify.log.debug(`Token extracted, length: ${token.length}`);
      
      // Special handling for test tokens when in test mode
      const isTestMode = process.env.NODE_ENV === 'test';
      const isTestToken = token.startsWith('test_');
      
      if (isTestMode && isTestToken) {
        fastify.log.info('Using test authentication token');
        
        try {
          // Extract user data from the test token
          const tokenData = JSON.parse(Buffer.from(token.slice(5), 'base64').toString());
          
          if (!tokenData.sub) {
            fastify.log.error('Invalid test token: Missing user ID');
            return reply.status(401).send({ error: 'Unauthorized: Invalid test token' });
          }
          
          // Set user on request
          request.user = {
            id: tokenData.sub,
            email: tokenData.email,
            role: tokenData.role || 'authenticated',
            aud: 'authenticated'
          };
          
          fastify.log.debug(`Test user authenticated: ${tokenData.sub}`);
          return;
        } catch (err) {
          fastify.log.error({ err }, 'Failed to parse test token');
          return reply.status(401).send({ error: 'Unauthorized: Invalid test token format' });
        }
      }
      
      // Normal token verification with Supabase
      fastify.log.debug('Verifying token with Supabase...');
      const { data, error } = await fastify.supabase.auth.getUser(token);
      
      if (error) {
        fastify.log.error({ 
          error, 
          errorName: error.name,
          errorMessage: error.message,
          statusCode: error.status
        }, 'Authentication failed: Supabase rejected the token');
        return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
      }
      
      if (!data || !data.user) {
        fastify.log.error('Authentication failed: No user returned from Supabase');
        return reply.status(401).send({ error: 'Unauthorized: User not found' });
      }
      
      // Set user on request
      request.user = data.user;
      fastify.log.debug(`User authenticated: ${data.user.id}`);
      
    } catch (err) {
      fastify.log.error({ err }, 'Authentication error: Exception during authentication');
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