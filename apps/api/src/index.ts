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

// CRITICAL: Load environment variables before any other imports
import * as dotenv from 'dotenv';

// Load environment variables from different possible locations
console.log('[API] Current working directory:', process.cwd());
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
dotenv.config({ path: '../../.env.local' });
dotenv.config({ path: '../../.env' });

// Now import other modules
import { apiEnv } from 'config';
import { buildServer } from './server';
import { logger } from './utils/logger';

// Log environment variables for diagnostic purposes
console.log('[API] Environment variables loaded:');
console.log(`  API_PORT = ${process.env.API_PORT || '[NOT SET]'}`);
console.log(`  API_HOST = ${process.env.API_HOST || '[NOT SET]'}`);
console.log(`  SUPABASE_URL = ${process.env.SUPABASE_URL || '[NOT SET]'}`);
console.log(`  SUPABASE_ANON_KEY = ${process.env.SUPABASE_ANON_KEY ? '[SET]' : '[NOT SET]'}`);
console.log(`  SUPABASE_SERVICE_ROLE_KEY = ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '[SET]' : '[NOT SET]'}`);

// Start the server
const start = async () => {
  try {
    console.log('[API] Building server');
    const server = await buildServer();
    
    // Start listening
    console.log('[API] Starting server');
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