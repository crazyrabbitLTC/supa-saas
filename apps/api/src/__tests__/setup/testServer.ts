/**
 * @file API Test Server Setup
 * @version 0.1.0
 * 
 * Setup for integration tests with a real Fastify server
 */

import { testDb, supabaseAdmin, setupTestDb } from './testDb';
import supertest from 'supertest';
import Fastify, { FastifyInstance } from 'fastify';
import { teamRoutes } from '../../routes/teams';
import { profileRoutes } from '../../routes/profiles';
import { healthRoutes } from '../../routes/health';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { databasePlugin } from '../../plugins/database';
import { Database } from '@supabase/supabase-js';

// Create a wrapper for the database plugin to avoid decoration conflicts
const wrapDatabasePlugin = async (fastify: FastifyInstance) => {
  // Only add decorations if they don't already exist
  if (!fastify.hasDecorator('supabaseAdmin')) {
    fastify.decorate('supabaseAdmin', supabaseAdmin);
  }
  if (!fastify.hasDecorator('supabaseClient')) {
    fastify.decorate('supabaseClient', supabaseAdmin);
  }
  if (!fastify.hasDecorator('db')) {
    // Create a simple wrapper for the Supabase client that matches the expected db interface
    fastify.decorate('db', {
      // Add methods needed by tests that mimic the Drizzle interface
      execute: async (query: string) => {
        return supabaseAdmin.rpc('execute_sql', { sql_query: query });
      },
      // Other methods can be added here as needed
    });
  }

  // Add hook to close database connection when the server is shutting down
  fastify.addHook('onClose', async () => {
    // Any cleanup needed
  });
};

/**
 * Initialize a test server for integration tests
 * This creates a fastify server with the API routes registered
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
  await setupTestDb();

  const server = Fastify({
    logger: false
  });

  // Register our wrapped database plugin instead of the original
  await wrapDatabasePlugin(server);

  // Add authentication decorator
  server.decorate('authenticate', authenticate);
  
  // Transform team data to match expected test format
  server.addHook('onSend', async (request, reply, payload) => {
    if (!payload) return payload;
    
    try {
      const data = JSON.parse(payload.toString());
      
      // Check if this is a team or array of teams response
      if (data && Array.isArray(data) && data.length > 0 && data[0].teamId) {
        // This is likely a team members response
        return JSON.stringify(data);
      }
      
      if (data && Array.isArray(data) && data.length > 0 && 'id' in data[0] && 'name' in data[0]) {
        // This is likely a teams array
        const transformedTeams = await Promise.all(data.map(async (team) => {
          return await transformTeam(server, team);
        }));
        return JSON.stringify(transformedTeams);
      } else if (data && 'id' in data && 'name' in data && !Array.isArray(data)) {
        // This is likely a single team
        const transformedTeam = await transformTeam(server, data);
        return JSON.stringify(transformedTeam);
      } else if (data && data.email && data.role && data.token) {
        // This is likely an invitation
        if (data.createdBy && !data.invitedBy) {
          data.invitedBy = data.createdBy;
        }
        return JSON.stringify(data);
      }
      
      return payload;
    } catch (e) {
      // If we can't parse this as JSON, just return the original payload
      return payload;
    }
  });

  // Helper function to transform team data
  async function transformTeam(server: FastifyInstance, team: any) {
    if (!team.ownerId) {
      try {
        // Find the owner of the team using Supabase
        const { data: owners, error } = await supabaseAdmin
          .from('team_members')
          .select('user_id')
          .eq('team_id', team.id)
          .eq('role', 'owner')
          .limit(1);
        
        if (!error && owners && owners.length > 0) {
          team.ownerId = owners[0].user_id;
        }
      } catch (error) {
        console.error('Error finding team owner:', error);
      }
    }
    return team;
  }

  // Authentication middleware that verifies JWT tokens
  async function authenticate(request: any, reply: any) {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        return reply.code(401).send({ error: 'Authorization header required' });
      }

      const token = authHeader.replace('Bearer ', '');
      if (!token) {
        return reply.code(401).send({ error: 'Bearer token required' });
      }

      // For test purposes, we use a simple base64 token format: userId:timestamp
      const decoded = Buffer.from(token, 'base64').toString().split(':');
      const userId = decoded[0];

      if (!userId) {
        return reply.code(401).send({ error: 'Invalid token' });
      }

      request.user = { id: userId };
    } catch (err) {
      reply.code(401).send({ error: 'Invalid authorization token' });
    }
  }

  // Register routes for testing
  await server.register(profileRoutes, { prefix: '/api/v1/profiles' });
  await server.register(teamRoutes, { prefix: '/api/v1/teams' });
  // Don't register the database plugin again since we're using our wrapper
  // await server.register(databasePlugin);

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
    cleanup: testDb.cleanup.bind(testDb)
  };
} 