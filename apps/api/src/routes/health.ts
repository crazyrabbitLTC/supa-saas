/**
 * @file Health Check Routes
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Health check endpoints for the API server.
 * 
 * IMPORTANT:
 * - These endpoints are used for monitoring
 * - They should be lightweight and fast
 * 
 * Functionality:
 * - Provides basic health check endpoint
 * - Provides detailed health check with dependencies
 */

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { executeRawQuery } from 'database';

/**
 * Health check routes
 * @param fastify The Fastify instance
 */
export const healthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Basic health check
  fastify.get('/', async () => {
    return { status: 'ok' };
  });
  
  // Detailed health check with dependencies
  fastify.get('/detailed', async () => {
    // Check database connection
    let dbStatus = 'ok';
    try {
      // Simple query to check database connection
      await executeRawQuery('SELECT 1');
    } catch (error) {
      fastify.log.error(error, 'Database health check failed');
      dbStatus = 'error';
    }
    
    // Check Supabase connection
    let supabaseStatus = 'ok';
    try {
      const { error } = await fastify.supabase.auth.getSession();
      if (error) throw error;
    } catch (error) {
      fastify.log.error(error, 'Supabase health check failed');
      supabaseStatus = 'error';
    }
    
    return {
      status: dbStatus === 'ok' && supabaseStatus === 'ok' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        supabase: supabaseStatus,
      },
    };
  });
}; 