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
 * Builds and configures a Fastify server instance
 * @returns A configured Fastify server
 */
export async function buildServer(): Promise<FastifyInstance> {
  // Create Fastify instance
  const server = Fastify({
    logger,
  });
  
  // Register error handler
  server.setErrorHandler(errorHandler);
  
  // Register plugins
  await registerPlugins(server);
  
  // Register routes
  registerRoutes(server);
  
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
  
  return server;
}

/**
 * Registers plugins with the Fastify server
 * @param server The Fastify server instance
 */
async function registerPlugins(server: FastifyInstance): Promise<void> {
  // Security plugins
  await server.register(helmet);
  await server.register(cors, {
    origin: true, // Reflect the request origin
    credentials: true,
  });
  
  // Database plugin
  await server.register(databasePlugin);
  
  // Authentication plugin
  await server.register(authPlugin);
  
  // Add more plugins here
} 