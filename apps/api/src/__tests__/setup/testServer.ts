/**
 * @file API Test Server Setup
 * @version 0.1.0
 * 
 * Setup for integration tests with a real Fastify server
 */

import { FastifyInstance } from 'fastify';
import { testDb, supabaseAdmin } from './testDb';
import supertest from 'supertest';
import Fastify from 'fastify';
import { sql } from 'drizzle-orm';

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
  // Create a new Fastify instance for testing
  const server = Fastify({
    logger: false,
    trustProxy: true
  });

  // Add supabase to server
  server.decorate('supabase', supabaseAdmin);
  server.decorate('db', { execute: async (query: any) => {
    if (typeof query === 'object' && query.text && query.values) {
      return await supabaseAdmin.from('_query').select().execute(query.text, query.values);
    } else {
      // Handle raw SQL queries for drizzle-orm
      return await supabaseAdmin.from('_query').select().execute(query.getSQL().sql, []);
    }
  }});

  // Create authentication middleware
  const authenticate = async (request: any, reply: any) => {
    if (!request.headers.authorization) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // Extract token from Authorization header
    const token = request.headers.authorization.replace('Bearer ', '');
    
    try {
      // Verify JWT
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !data.user) {
        return reply.status(401).send({ error: 'Invalid token' });
      }
      
      // Set the user on the request
      request.user = data.user;
    } catch (err) {
      console.error('Auth error:', err);
      return reply.status(401).send({ error: 'Authentication failed' });
    }
  };

  // Register team routes for testing
  server.register(async (router) => {
    // Apply authentication to all routes
    router.addHook('onRequest', authenticate);
    
    // GET /teams endpoint
    router.get('/', async (request: any, reply) => {
      const userId = request.user.id;
      
      const { data, error } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('owner_id', userId);
      
      if (error) {
        return reply.status(500).send({ error: error.message });
      }
      
      return data;
    });
    
    // GET /teams/:id endpoint
    router.get('/:id', async (request: any, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;
      
      // Check if user is a team member
      const { data: memberData, error: memberError } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('team_id', id)
        .eq('user_id', userId)
        .limit(1);
      
      if (memberError) {
        return reply.status(500).send({ error: memberError.message });
      }
      
      if (!memberData || memberData.length === 0) {
        return reply.status(403).send({ error: 'Forbidden: You are not a member of this team' });
      }
      
      // Get team details
      const { data, error } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('id', id)
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return reply.status(404).send({ error: 'Team not found' });
        }
        return reply.status(500).send({ error: error.message });
      }
      
      return data;
    });
    
    // GET /teams/:id/subscription endpoint
    router.get('/:id/subscription', async (request: any, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;
      
      // Check if user is a team member
      const { data: memberData, error: memberError } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('team_id', id)
        .eq('user_id', userId)
        .limit(1);
      
      if (memberError) {
        return reply.status(500).send({ error: memberError.message });
      }
      
      if (!memberData || memberData.length === 0) {
        return reply.status(403).send({ error: 'Forbidden: You are not a member of this team' });
      }
      
      // Get team details
      const { data, error } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('id', id)
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return reply.status(404).send({ error: 'Team not found' });
        }
        return reply.status(500).send({ error: error.message });
      }
      
      // Get subscription features based on tier
      const features = {
        free: {
          maxMembers: 3,
          maxProjects: 1,
          storage: '1GB',
          support: 'community'
        },
        basic: {
          maxMembers: 10,
          maxProjects: 5,
          storage: '10GB',
          support: 'email'
        },
        pro: {
          maxMembers: 50,
          maxProjects: 20,
          storage: '100GB',
          support: 'priority'
        },
        enterprise: {
          maxMembers: 'unlimited',
          maxProjects: 'unlimited',
          storage: '1TB',
          support: 'dedicated'
        }
      };
      
      // Return subscription details
      return {
        teamId: id,
        subscriptionTier: data.subscription_tier || 'free',
        subscriptionId: data.subscription_id,
        features: features[data.subscription_tier as keyof typeof features] || features.free
      };
    });
    
    // GET /teams/:id/members endpoint
    router.get('/:id/members', async (request: any, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;
      
      // Check if user is a team member
      const { data: memberData, error: memberError } = await supabaseAdmin
        .from('team_members')
        .select('id')
        .eq('team_id', id)
        .eq('user_id', userId)
        .limit(1);
      
      if (memberError) {
        return reply.status(500).send({ error: memberError.message });
      }
      
      if (!memberData || memberData.length === 0) {
        return reply.status(403).send({ error: 'Forbidden: You are not a member of this team' });
      }
      
      // Get team members
      const { data, error } = await supabaseAdmin
        .from('team_members')
        .select('id, team_id, user_id, role, created_at')
        .eq('team_id', id);
      
      if (error) {
        return reply.status(500).send({ error: error.message });
      }
      
      // Transform snake_case to camelCase
      return data.map(member => ({
        id: member.id,
        teamId: member.team_id,
        userId: member.user_id,
        role: member.role,
        createdAt: member.created_at
      }));
    });
  }, { prefix: '/teams' });
  
  // Initialize the server
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