/**
 * @file Routes Index
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Registers all API routes with the Fastify server.
 * 
 * IMPORTANT:
 * - Add new route modules here
 * - Keep routes organized by feature
 * 
 * Functionality:
 * - Registers all route modules
 * - Provides a health check endpoint
 */

import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health';
import { profileRoutes } from './profiles';

/**
 * Registers all routes with the Fastify server
 * @param server The Fastify server instance
 */
export function registerRoutes(server: FastifyInstance): void {
  // Register health check routes
  server.register(healthRoutes, { prefix: '/health' });
  
  // Register API routes with version prefix
  server.register(
    async (api) => {
      // Register profile routes
      api.register(profileRoutes, { prefix: '/profiles' });
      
      // Add more route modules here
    },
    { prefix: '/api/v1' }
  );
} 