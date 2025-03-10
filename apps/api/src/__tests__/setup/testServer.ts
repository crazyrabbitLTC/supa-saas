/**
 * @file API Test Server Setup
 * @version 0.1.0
 * 
 * Setup for integration tests with a real Fastify server
 */

import { FastifyInstance } from 'fastify';
import { buildServer } from '../../server';
import { testDb } from './testDb';
import supertest from 'supertest';

/**
 * Initialize a test server for integration tests
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
  // Build a new server instance for testing
  const server = await buildServer();
  
  // Don't actually start listening on a port
  await server.ready();
  
  // Create supertest instance
  const request = supertest(server.server);
  
  return {
    server,
    request,
    auth: {
      getAuthHeader: testDb.getAuthHeader.bind(testDb),
      createTestUser: testDb.createTestUser.bind(testDb),
      createTestTeam: testDb.createTestTeam.bind(testDb),
      addTeamMember: testDb.addTeamMember.bind(testDb),
      createTeamInvitation: testDb.createTeamInvitation.bind(testDb)
    },
    cleanup: async () => {
      await testDb.cleanup();
      await server.close();
    }
  };
} 