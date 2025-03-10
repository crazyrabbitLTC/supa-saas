/**
 * @file API Test Server Setup
 * @version 0.1.0
 * 
 * Setup for integration tests with a real Fastify server
 */

import { testDb } from './testDb';
import supertest from 'supertest';
import { buildServer } from '../../server';
import { FastifyInstance } from 'fastify';

/**
 * Initialize a test server for integration tests
 * This creates a real Fastify server using the production buildServer function
 * and a test client that can be used to make requests to the server
 */
export async function initTestServer(): Promise<{
  server: FastifyInstance;
  request: supertest.SuperTest<supertest.Test>;
  auth: {
    getAuthHeader: (userId: string) => Promise<{ Authorization: string }>;
    createTestUser: typeof testDb.createTestUser;
    createTestTeam: typeof testDb.createTestTeam;
    addTeamMember: typeof testDb.addTeamMember;
    createTeamInvitation: typeof testDb.createTeamInvitation;
  };
  cleanup: () => Promise<void>;
}> {
  // Set up necessary environment variables for testing
  process.env.NODE_ENV = 'test';
  console.log('Setting up test environment...');
  
  try {
    await testDb.setupTestDb();
    console.log('Test database setup completed successfully');
  } catch (error) {
    console.error('Test database setup failed:', error);
    throw error;
  }

  console.log('Building server...');
  let server;
  
  try {
    // Use the real production server builder
    server = await buildServer();
    console.log('Server built successfully');
    
    // Add debug logging before listening
    server.addHook('onRequest', (request, reply, done) => {
      console.log(`[DEBUG] onRequest hook triggered for ${request.method} ${request.url}`);
      done();
    });
    
    server.addHook('onResponse', (request, reply, done) => {
      console.log(`[DEBUG] onResponse hook triggered for ${request.method} ${request.url} - Status: ${reply.statusCode}`);
      done();
    });
    
    server.addHook('onError', (request, reply, error, done) => {
      console.error(`[DEBUG] onError hook triggered for ${request.method} ${request.url}:`, error);
      done();
    });
    
    // Log all registered routes
    console.log('Registered routes:');
    const routes = server.getRoutes ? server.getRoutes() : [];
    routes.forEach((route: any) => {
      console.log(`${route.method} ${route.url}`);
    });
    
    // IMPORTANT: Start the server
    // This is critical - without this the server hooks won't be properly initialized
    await server.listen({ port: 0 });
    const address = server.addresses()[0];
    const port = typeof address === 'object' ? address.port : 0;
    console.log(`Server listening on port ${port}`);
    
  } catch (error) {
    console.error('Server build or startup failed:', error);
    throw error;
  }
  
  // Create test context
  return {
    server,
    request: supertest(server.server),
    auth: {
      getAuthHeader: testDb.getAuthHeader.bind(testDb),
      createTestUser: testDb.createTestUser.bind(testDb),
      createTestTeam: testDb.createTestTeam.bind(testDb),
      addTeamMember: testDb.addTeamMember.bind(testDb),
      createTeamInvitation: testDb.createTeamInvitation.bind(testDb)
    },
    cleanup: async () => {
      console.log('Cleaning up test environment...');
      try {
        await server.close();
        await testDb.cleanup();
        console.log('Cleanup completed successfully');
      } catch (error) {
        console.error('Cleanup failed:', error);
      }
    }
  };
} 