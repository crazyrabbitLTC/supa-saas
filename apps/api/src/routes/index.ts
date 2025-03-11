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
import { teamRoutes, invitationRoutes } from './teams';

/**
 * Registers all routes with the Fastify server
 * @param server The Fastify server instance
 */
export function registerRoutes(server: FastifyInstance): void {
  console.log('Starting route registration...');
  
  // Register health check routes
  console.log('Registering health check routes...');
  server.register(healthRoutes, { prefix: '/health' });
  console.log('Health check routes registered');
  
  // Register API routes with version prefix
  console.log('Registering API routes with version prefix...');
  server.register(
    async (api) => {
      // Register profile routes
      console.log('Registering profile routes...');
      api.register(profileRoutes, { prefix: '/profiles' });
      console.log('Profile routes registered');
      
      // Register team routes
      console.log('Registering team routes...');
      api.register(teamRoutes, { prefix: '/teams' });
      console.log('Team routes registered');
      
      // Register invitation routes
      console.log('Registering invitation routes...');
      api.register(invitationRoutes, { prefix: '/invitations' });
      console.log('Invitation routes registered');
      
      // Add more route modules here
    },
    { prefix: '/api/v1' }
  );
  console.log('API routes registered with version prefix');
  
  console.log('Route registration complete');
} 