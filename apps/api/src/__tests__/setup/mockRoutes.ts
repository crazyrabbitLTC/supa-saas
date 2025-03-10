/**
 * @file Mock Routes for Testing
 * @version 0.1.0
 * 
 * Simplified route implementations for testing
 */

import { FastifyInstance } from 'fastify';
import { sql } from 'drizzle-orm';

/**
 * Register mock team routes for testing
 */
export function registerMockTeamRoutes(fastify: FastifyInstance) {
  // Create a test authentication middleware
  const authenticate = async (request: any, reply: any) => {
    if (!request.headers.authorization) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // Extract token from Authorization header
    const token = request.headers.authorization.replace('Bearer ', '');
    
    try {
      // Verify JWT
      const { data, error } = await fastify.supabase.auth.getUser(token);
      
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

  // Register team routes
  fastify.register(async (teamRouter) => {
    // Add authentication to all routes
    teamRouter.addHook('onRequest', authenticate);
    
    // GET /teams
    teamRouter.get('/', async (request, reply) => {
      const userId = request.user.id;
      
      const teams = await fastify.db.execute(
        sql`SELECT t.* 
            FROM teams t
            JOIN team_members tm ON t.id = tm.team_id
            WHERE tm.user_id = ${userId}`
      );
      
      return teams;
    });
    
    // GET /teams/:id
    teamRouter.get('/:id', async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;
      
      // Check if user is a team member
      const isMember = await fastify.db.execute(
        sql`SELECT EXISTS(
          SELECT 1 FROM team_members
          WHERE team_id = ${id} AND user_id = ${userId}
        ) as is_member`
      );
      
      if (!isMember[0]?.is_member) {
        return reply.status(403).send({ error: 'Forbidden: You are not a member of this team' });
      }
      
      // Get team details
      const teams = await fastify.db.execute(
        sql`SELECT * FROM teams WHERE id = ${id}`
      );
      
      if (!teams.length) {
        return reply.status(404).send({ error: 'Team not found' });
      }
      
      return teams[0];
    });
    
    // GET /teams/:id/subscription
    teamRouter.get('/:id/subscription', async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;
      
      // Check if user is a team member
      const isMember = await fastify.db.execute(
        sql`SELECT EXISTS(
          SELECT 1 FROM team_members
          WHERE team_id = ${id} AND user_id = ${userId}
        ) as is_member`
      );
      
      if (!isMember[0]?.is_member) {
        return reply.status(403).send({ error: 'Forbidden: You are not a member of this team' });
      }
      
      // Get team details
      const teams = await fastify.db.execute(
        sql`SELECT * FROM teams WHERE id = ${id}`
      );
      
      if (!teams.length) {
        return reply.status(404).send({ error: 'Team not found' });
      }
      
      const team = teams[0];
      
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
        subscriptionTier: team.subscription_tier || 'free',
        subscriptionId: team.subscription_id,
        features: features[team.subscription_tier as keyof typeof features] || features.free
      };
    });
    
    // GET /teams/:id/members
    teamRouter.get('/:id/members', async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;
      
      // Check if user is a team member
      const isMember = await fastify.db.execute(
        sql`SELECT EXISTS(
          SELECT 1 FROM team_members
          WHERE team_id = ${id} AND user_id = ${userId}
        ) as is_member`
      );
      
      if (!isMember[0]?.is_member) {
        return reply.status(403).send({ error: 'Forbidden: You are not a member of this team' });
      }
      
      // Get team members
      const members = await fastify.db.execute(
        sql`SELECT 
              tm.id, 
              tm.team_id AS "teamId", 
              tm.user_id AS "userId", 
              tm.role, 
              tm.created_at AS "createdAt"
            FROM team_members tm
            WHERE tm.team_id = ${id}`
      );
      
      return members;
    });
  }, { prefix: '/teams' });
} 