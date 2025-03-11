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
  console.log('[AUTH PLUGIN] Initializing authentication plugin');

  // Debug the hooks state before registration
  // @ts-ignore - Accessing Fastify internals for debugging
  const preHooks = fastify.hasOwnProperty('_hooks') ? fastify['_hooks'] : {};
  console.log('[AUTH PLUGIN] Pre-registration hooks:');
  Object.keys(preHooks).forEach(hookName => {
    console.log(`[AUTH PLUGIN]   Hook: ${hookName}, Handlers: ${preHooks[hookName]?.length || 0}`);
  });
  
  // Authentication middleware
  const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
    console.log('[AUTH PLUGIN] Running authenticate middleware');
    try {
      // Check if Authorization header exists
      if (!request.headers.authorization) {
        console.log('[AUTH PLUGIN] Authentication failed: Missing authorization header');
        fastify.log.info('Authentication failed: Missing authorization header');
        return reply.status(401).send({ error: 'Unauthorized: Missing token' });
      }
      
      // Extract token from Authorization header
      const authHeader = request.headers.authorization;
      console.log(`[AUTH PLUGIN] Auth header format: ${authHeader.substring(0, 15)}...`);
      fastify.log.debug(`Auth header format: ${authHeader.substring(0, 20)}...`);
      
      const token = authHeader.replace('Bearer ', '');
      console.log(`[AUTH PLUGIN] Token extracted, length: ${token.length}`);
      fastify.log.debug(`Token extracted, length: ${token.length}`);
      
      // Special handling for test tokens when in test mode
      const isTestMode = process.env.NODE_ENV === 'test';
      const isTestToken = token.startsWith('test_');
      
      console.log(`[AUTH PLUGIN] isTestMode: ${isTestMode}, isTestToken: ${isTestToken}`);
      
      if (isTestMode && isTestToken) {
        console.log('[AUTH PLUGIN] Using test authentication token');
        fastify.log.info('Using test authentication token');
        
        try {
          // Extract user data from the test token
          const tokenData = JSON.parse(Buffer.from(token.slice(5), 'base64').toString());
          
          if (!tokenData.sub) {
            console.log('[AUTH PLUGIN] Invalid test token: Missing user ID');
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
          
          console.log(`[AUTH PLUGIN] Test user authenticated: ${tokenData.sub}`);
          fastify.log.debug(`Test user authenticated: ${tokenData.sub}`);
          return;
        } catch (err) {
          console.log('[AUTH PLUGIN] Failed to parse test token', err);
          fastify.log.error({ err }, 'Failed to parse test token');
          return reply.status(401).send({ error: 'Unauthorized: Invalid test token format' });
        }
      }
      
      // Normal token verification with Supabase
      console.log('[AUTH PLUGIN] Verifying token with Supabase...');
      fastify.log.debug('Verifying token with Supabase...');
      const { data, error } = await fastify.supabase.auth.getUser(token);
      
      if (error) {
        console.log('[AUTH PLUGIN] Authentication failed: Supabase rejected the token', {
          errorName: error.name,
          errorMessage: error.message,
          statusCode: error.status
        });
        fastify.log.error({ 
          error, 
          errorName: error.name,
          errorMessage: error.message,
          statusCode: error.status
        }, 'Authentication failed: Supabase rejected the token');
        return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
      }
      
      if (!data || !data.user) {
        console.log('[AUTH PLUGIN] Authentication failed: No user returned from Supabase');
        fastify.log.error('Authentication failed: No user returned from Supabase');
        return reply.status(401).send({ error: 'Unauthorized: User not found' });
      }
      
      // Set user on request
      request.user = data.user;
      console.log(`[AUTH PLUGIN] User authenticated: ${data.user.id}`);
      fastify.log.debug(`User authenticated: ${data.user.id}`);
      
    } catch (err) {
      console.log('[AUTH PLUGIN] Authentication error: Exception during authentication', err);
      fastify.log.error({ err }, 'Authentication error: Exception during authentication');
      return reply.status(401).send({ error: 'Unauthorized: Authentication failed' });
    }
  };
  
  // Add authenticate method to Fastify instance
  console.log('[AUTH PLUGIN] Decorating fastify instance with authenticate method');
  fastify.decorate('authenticate', authenticate);
  
  // Add onRequest hook for debugging 
  console.log('[AUTH PLUGIN] Adding onRequest hook for debugging');
  fastify.addHook('onRequest', (request, reply, done) => {
    console.log(`[AUTH PLUGIN] onRequest hook triggered for ${request.method} ${request.url}`);
    done();
  });
  
  // Add preHandler hook for debugging
  console.log('[AUTH PLUGIN] Adding preHandler hook for debugging');
  fastify.addHook('preHandler', (request, reply, done) => {
    console.log(`[AUTH PLUGIN] preHandler hook triggered for ${request.method} ${request.url}`);
    done();
  });
  
  // Debug the hooks state after registration
  // @ts-ignore - Accessing Fastify internals for debugging
  const postHooks = fastify.hasOwnProperty('_hooks') ? fastify['_hooks'] : {};
  console.log('[AUTH PLUGIN] Post-registration hooks:');
  Object.keys(postHooks).forEach(hookName => {
    console.log(`[AUTH PLUGIN]   Hook: ${hookName}, Handlers: ${postHooks[hookName]?.length || 0}`);
  });
  
  // Log that the auth plugin is registered
  console.log('[AUTH PLUGIN] Authentication plugin registered');
  fastify.log.info('Authentication plugin registered');
};

// Export the plugin
export const authPlugin = fp(authPluginAsync, {
  name: 'auth',
  dependencies: ['database'],
}); 