/**
 * @file Database Plugin
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Fastify plugin for database access.
 * 
 * IMPORTANT:
 * - This plugin adds database clients to the Fastify instance
 * - Use this plugin to access the database in routes
 * 
 * Functionality:
 * - Adds database clients to Fastify
 * - Provides type definitions for the database clients
 */

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { db, supabaseAdmin, supabaseClient, executeRawQuery } from 'database';

// Extend FastifyInstance type to include database clients
declare module 'fastify' {
  interface FastifyInstance {
    db: typeof db;
    supabase: typeof supabaseAdmin;
    supabaseClient: typeof supabaseClient;
    executeRawQuery: typeof executeRawQuery;
  }
}

/**
 * Plugin that adds database clients to the Fastify instance
 * @param fastify The Fastify instance
 */
const databasePluginAsync: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Add database clients to Fastify instance
  fastify.decorate('db', db);
  fastify.decorate('supabase', supabaseAdmin);
  fastify.decorate('supabaseClient', supabaseClient);
  fastify.decorate('executeRawQuery', executeRawQuery);
  
  // Log that the database plugin is registered
  fastify.log.info('Database plugin registered');
  
  // Add hook to close database connections when the server is shutting down
  fastify.addHook('onClose', async (instance) => {
    fastify.log.info('Closing database connections');
    // Any cleanup needed for database connections
  });
};

// Export the plugin
export const databasePlugin = fp(databasePluginAsync, {
  name: 'database',
}); 