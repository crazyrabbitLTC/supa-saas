/**
 * @file API Server Entry Point
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Main entry point for the API server.
 * 
 * IMPORTANT:
 * - Server configuration is loaded from environment variables
 * - Routes are registered automatically
 * 
 * Functionality:
 * - Creates and configures the Fastify server
 * - Registers plugins and routes
 * - Starts the server
 */

import { apiEnv } from 'config';
import { buildServer } from './server';
import { logger } from './utils/logger';

// Start the server
const start = async () => {
  try {
    const server = await buildServer();
    
    // Start listening
    await server.listen({
      port: apiEnv.API_PORT,
      host: apiEnv.API_HOST,
    });
    
    // Log server address
    const address = server.server.address();
    const port = typeof address === 'string' ? address : address?.port;
    
    logger.info(`Server listening on ${apiEnv.API_HOST}:${port}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error(err);
  process.exit(1);
});

// Start the server
start(); 