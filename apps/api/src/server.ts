/**
 * @file Server Configuration
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Configures the Fastify server with plugins and routes.
 * 
 * IMPORTANT:
 * - Add new plugins to the registerPlugins function
 * - Add new routes to the registerRoutes function
 * 
 * Functionality:
 * - Creates a Fastify server instance
 * - Registers plugins (cors, helmet, etc.)
 * - Registers routes
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { logger } from './utils/logger';
import { registerRoutes } from './routes';
import { databasePlugin } from './plugins/database';
import { authPlugin } from './plugins/auth';
import { errorHandler } from './middleware/error-handler';

/**
 * Options for building the server
 */
interface BuildServerOptions {
  skipRouteRegistration?: boolean;
}

/**
 * Builds and configures a Fastify server instance
 * @param options Options for building the server
 * @returns A configured Fastify server
 */
export async function buildServer(options: BuildServerOptions = {}): Promise<FastifyInstance> {
  console.log('=== BUILDING SERVER ===');
  
  // Create Fastify instance
  console.log('Creating Fastify instance...');
  const server = Fastify({
    logger,
  });
  console.log('Fastify instance created');
  
  // Register error handler
  console.log('Registering error handler...');
  server.setErrorHandler(errorHandler);
  console.log('Error handler registered');
  
  // Register plugins
  console.log('Registering plugins...');
  await registerPlugins(server);
  console.log('All plugins registered');
  
  // Register routes (unless skipped)
  if (!options.skipRouteRegistration) {
    console.log('Registering routes...');
    registerRoutes(server);
    console.log('All routes registered');
  } else {
    console.log('Skipping route registration (will be done manually)');
  }
  
  // Log all registered routes
  console.log('=== REGISTERED ROUTES ===');
  const routes = server.printRoutes ? server.printRoutes() : server.getRoutes();
  
  if (typeof routes === 'string') {
    // If printRoutes returns a string, log it directly
    console.log(routes);
  } else {
    // If getRoutes returns an array, format and log each route
    routes.forEach((route: any) => {
      console.log(`${route.method} ${route.url}`);
    });
  }
  console.log('=========================');
  
  console.log('=== SERVER BUILD COMPLETE ===');
  return server;
}

/**
 * Registers plugins with the Fastify server
 * @param server The Fastify server instance
 */
async function registerPlugins(server: FastifyInstance): Promise<void> {
  // Security plugins
  console.log('Registering security plugins...');
  await server.register(helmet);
  console.log('Helmet plugin registered');
  await server.register(cors, {
    origin: true, // Reflect the request origin
    credentials: true,
  });
  console.log('CORS plugin registered');
  
  // Database plugin
  console.log('Registering database plugin...');
  await server.register(databasePlugin);
  console.log('Database plugin registered');
  
  // Authentication plugin
  console.log('Registering authentication plugin...');
  await server.register(authPlugin);
  console.log('Authentication plugin registered');
  
  // Add more plugins here
} 