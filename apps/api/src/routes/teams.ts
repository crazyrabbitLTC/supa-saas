/**
 * @file Team Routes
 * @version 0.1.0
 * @status DRAFT
 * @lastModified 2023-05-11
 * 
 * API routes for team management.
 * 
 * IMPORTANT:
 * - All routes require authentication
 * - Routes follow RESTful conventions
 * 
 * Functionality:
 * - Team CRUD operations
 * - Team member management
 * - Team invitations
 * - Subscription management
 */

import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { TeamController } from '../controllers/teamController';
import { sql } from 'drizzle-orm';
import { supabaseAdmin } from 'database';

export const teamRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const teamController = new TeamController();

  // Require authentication for all team routes
  fastify.addHook('onRequest', fastify.authenticate);

  // Helper function to add owner information to team responses
  const formatTeamResponse = async (team: any) => {
    if (!team) return team;
    
    console.log(`[DEBUG] formatTeamResponse called for team id: ${team.id}, name: ${team.name}`);
    console.log(`[DEBUG] Initial team object:`, JSON.stringify(team));
    console.log(`[DEBUG] Initial team keys:`, Object.keys(team));
    
    let ownerId: string | undefined = undefined;
    
    try {
      // Find the owner of the team using Supabase
      console.log(`[DEBUG] Querying team_members for owner of team ${team.id}`);
      const { data, error } = await supabaseAdmin
        .from('team_members')
        .select('user_id')
        .eq('team_id', team.id)
        .eq('role', 'owner')
        .limit(1)
        .single();
      
      if (error) {
        console.error(`[ERROR] Error finding team owner for team ${team.id}:`, error);
      } else if (data) {
        console.log(`[DEBUG] Found owner for team ${team.id}: ${data.user_id}`);
        ownerId = data.user_id;
      } else {
        console.log(`[WARN] No owner found for team ${team.id}`);
      }
    } catch (error) {
      console.error(`[ERROR] Exception finding team owner for team ${team.id}:`, error);
    }
    
    // Create a new object with all properties from the team plus the ownerId
    const formattedTeam = {
      ...team,
      ownerId
    };
    
    console.log(`[DEBUG] Formatted team object:`, JSON.stringify(formattedTeam));
    console.log(`[DEBUG] Formatted team keys:`, Object.keys(formattedTeam));
    console.log(`[DEBUG] Checking if ownerId exists and is enumerable:`, 
      formattedTeam.hasOwnProperty('ownerId'), 
      Object.getOwnPropertyDescriptor(formattedTeam, 'ownerId')
    );
    
    return formattedTeam;
  };

  // Format team arrays before sending
  const formatTeamsArray = async (teams: any[]) => {
    console.log(`[DEBUG] formatTeamsArray: Formatting ${teams.length} teams`);
    
    if (!teams || !Array.isArray(teams)) {
      console.log(`[DEBUG] formatTeamsArray: No teams to format or teams is not an array`);
      return teams;
    }
    
    // Format each team in the array
    const formattedTeams = await Promise.all(
      teams.map(async (team) => {
        console.log(`[DEBUG] formatTeamsArray: Formatting team ${team.id}`);
        const formattedTeam = await formatTeamResponse(team);
        console.log(`[DEBUG] formatTeamsArray: Formatted team ${team.id} with ownerId: ${formattedTeam.ownerId}`);
        return formattedTeam;
      })
    );
    
    console.log(`[DEBUG] formatTeamsArray: Completed formatting ${formattedTeams.length} teams`);
    console.log(`[DEBUG] formatTeamsArray: First team in array:`, 
      formattedTeams.length > 0 ? JSON.stringify(formattedTeams[0]) : 'No teams');
    
    return formattedTeams;
  };

  // Helper function to format invitation responses
  const formatInvitationResponse = (invitation: any) => {
    if (!invitation) return invitation;
    return invitation;
  };

  // Format invitation arrays before sending
  const formatInvitationsArray = (invitations: any[]) => {
    return invitations.map(invitation => formatInvitationResponse(invitation));
  };

  /**
   * Get all teams for current user
   */
  fastify.get('/', {
    schema: {
      tags: ['teams'],
      summary: 'Get all teams for current user',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              slug: { type: 'string' },
              description: { type: 'string' },
              logoUrl: { type: 'string' },
              isPersonal: { type: 'boolean' },
              subscriptionTier: { type: 'string' },
              maxMembers: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              ownerId: { type: 'string' }
            }
          }
        }
      }
    },
  }, async (request, reply) => {
    console.log(`[DEBUG] GET /teams: Fetching user teams`);
    
    try {
      // Get all teams for the user
      const teams = await teamController.getUserTeams(request, reply);
      
      // If the response has already been sent, return it as is
      if (reply.sent) {
        console.log(`[DEBUG] GET /teams: Reply already sent`);
        return teams;
      }
      
      // Log the raw teams for debugging
      console.log(`[DEBUG] GET /teams: Got ${teams ? teams.length : 0} teams from controller`);
      if (teams && teams.length > 0) {
        console.log(`[DEBUG] GET /teams: First team before formatting:`, JSON.stringify(teams[0]));
      }
      
      // Format teams array to include ownerId
      const formattedTeams = await formatTeamsArray(teams);
      
      // Log the formatted teams for debugging
      console.log(`[DEBUG] GET /teams: Returning ${formattedTeams ? formattedTeams.length : 0} formatted teams`);
      if (formattedTeams && formattedTeams.length > 0) {
        console.log(`[DEBUG] GET /teams: First team after formatting:`, JSON.stringify(formattedTeams[0]));
        console.log(`[DEBUG] GET /teams: First team keys:`, Object.keys(formattedTeams[0]));
        console.log(`[DEBUG] GET /teams: First team ownerId:`, formattedTeams[0].ownerId);
      }
      
      return reply.send(formattedTeams);
    } catch (error) {
      request.log.error(`Failed to get teams: ${error}`);
      return reply.status(500).send({ error: 'Failed to get teams' });
    }
  });

  /**
   * Create a new team
   */
  fastify.post('/', {
    schema: {
      tags: ['teams'],
      summary: 'Create a new team',
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          slug: { type: 'string', pattern: '^[a-z0-9-]+$', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          logoUrl: { type: 'string', format: 'uri' },
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            logoUrl: { type: 'string' },
            isPersonal: { type: 'boolean' },
            subscriptionTier: { type: 'string' },
            maxMembers: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            ownerId: { type: 'string' }
          },
          additionalProperties: true
        }
      }
    },
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      
      console.log(`[DEBUG] POST /teams: Creating team for user ${userId}`);
      
      const team = await teamController.createTeam(request.body, userId);
      console.log(`[DEBUG] POST /teams: Original team object:`, JSON.stringify(team));
      console.log(`[DEBUG] POST /teams: Team object properties:`, Object.keys(team));
      
      console.log(`[DEBUG] POST /teams: Formatting team response for ${team.id}`);
      // Format the team response to include the ownerId
      const formattedTeam = await formatTeamResponse(team);
      
      console.log(`[DEBUG] POST /teams: Formatted team object:`, JSON.stringify(formattedTeam));
      console.log(`[DEBUG] POST /teams: Formatted team properties:`, Object.keys(formattedTeam));
      console.log(`[DEBUG] POST /teams: Checking if ownerId is enumerable:`, Object.getOwnPropertyDescriptor(formattedTeam, 'ownerId'));
      
      // Create a completely new object with all properties explicitly copied
      const responseObj = {
        ...formattedTeam,
        ownerId: formattedTeam.ownerId // Explicitly copy the ownerId
      };
      
      console.log(`[DEBUG] POST /teams: Response object to be sent:`, JSON.stringify(responseObj));
      console.log(`[DEBUG] POST /teams: Response object properties:`, Object.keys(responseObj));
      
      // Return the explicitly constructed response object
      return reply.code(201).send(responseObj);
    } catch (error) {
      request.log.error(`Failed to create team: ${error}`);
      return reply.code(400).send({ error: 'Failed to create team' });
    }
  });

  /**
   * GET /teams/:id
   * Get a team by ID
   */
  fastify.get('/:id', async (request, reply) => {
    console.log(`[DEBUG] GET /teams/:id: Fetching team ${request.params.id}`);
    const response = await teamController.getTeamById(request, reply);
    
    // If the response has already been sent, return it as is
    if (reply.sent) {
      console.log('[DEBUG] GET /teams/:id: Reply already sent');
      return response;
    }
    
    // Format the team response
    if (response && !Array.isArray(response)) {
      console.log(`[DEBUG] GET /teams/:id: Formatting team response for ${response.id}`);
      const formattedTeam = await formatTeamResponse(response);
      console.log(`[DEBUG] GET /teams/:id: Formatted team response: `, formattedTeam);
      return reply.send(formattedTeam);
    }
    
    console.log('[DEBUG] GET /teams/:id: Sending response as-is');
    return reply.send(response);
  });

  /**
   * Update team details
   */
  fastify.put<{ Params: { id: string }; Body: object }>('/:id', {
    schema: {
      tags: ['teams'],
      summary: 'Update team details',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          logoUrl: { type: 'string', format: 'uri' },
          metadata: { type: 'object' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            logoUrl: { type: 'string' },
            isPersonal: { type: 'boolean' },
            subscriptionTier: { type: 'string' },
            maxMembers: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            ownerId: { type: 'string' }
          }
        }
      }
    },
  }, async (request, reply) => {
    try {
      console.log(`[DEBUG] PUT /teams/:id: Updating team ${request.params.id}`);
      
      const team = await teamController.updateTeam(request, reply);
      
      // If reply was already sent, return as is
      if (reply.sent) {
        console.log(`[DEBUG] PUT /teams/:id: Reply already sent for ${request.params.id}`);
        return team;
      }
      
      // Format the response to include ownerId
      console.log(`[DEBUG] PUT /teams/:id: Formatting team response for ${request.params.id}`);
      const formattedTeam = await formatTeamResponse(team);
      
      console.log(`[DEBUG] PUT /teams/:id: Returning formatted response for ${request.params.id}`);
      return reply.send(formattedTeam);
    } catch (error) {
      request.log.error(`Failed to update team: ${error}`);
      return reply.status(500).send({ error: 'Failed to update team' });
    }
  });

  // Delete a team
  fastify.delete('/:id', {
    schema: {
      tags: ['teams'],
      summary: 'Delete a team',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        204: {
          type: 'null',
          description: 'Team deleted successfully'
        }
      }
    },
    handler: teamController.deleteTeam.bind(teamController)
  });

  // Get team members
  fastify.get('/:id/members', {
    schema: {
      tags: ['teams'],
      summary: 'Get all members of a team',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              teamId: { type: 'string' },
              userId: { type: 'string' },
              role: { type: 'string', enum: ['owner', 'admin', 'member'] },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            }
          }
        }
      }
    },
    handler: teamController.getTeamMembers.bind(teamController)
  });

  // Update a member's role
  fastify.put('/:id/members/:userId', {
    schema: {
      tags: ['teams'],
      summary: 'Update a team member\'s role',
      params: {
        type: 'object',
        required: ['id', 'userId'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', enum: ['owner', 'admin', 'member'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            teamId: { type: 'string' },
            userId: { type: 'string' },
            role: { type: 'string', enum: ['owner', 'admin', 'member'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          }
        }
      }
    },
    handler: teamController.updateMemberRole.bind(teamController)
  });

  // Remove a member from a team
  fastify.delete('/:id/members/:userId', {
    schema: {
      tags: ['teams'],
      summary: 'Remove a member from a team',
      params: {
        type: 'object',
        required: ['id', 'userId'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        204: {
          type: 'null',
          description: 'Member removed successfully'
        }
      }
    },
    handler: teamController.removeMember.bind(teamController)
  });

  /**
   * POST /teams/:id/invitations
   * Invite a user to a team
   */
  fastify.post('/:id/invitations', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['owner', 'admin', 'member'] }
        }
      }
    }
  }, async (request, reply) => {
    const controller = new TeamController();
    // Just use the original controller without any formatting
    return controller.inviteToTeam(request, reply);
  });

  /**
   * GET /teams/:id/invitations
   * Get all pending invitations for a team
   */
  fastify.get('/:id/invitations', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {
    const controller = new TeamController();
    // Just use the original controller without any formatting
    return controller.getTeamInvitations(request, reply);
  });

  // Delete an invitation
  fastify.delete('/:id/invitations/:invitationId', {
    schema: {
      tags: ['teams'],
      summary: 'Delete an invitation',
      params: {
        type: 'object',
        required: ['id', 'invitationId'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          invitationId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        204: {
          type: 'null',
          description: 'Invitation deleted successfully'
        }
      }
    },
    handler: teamController.deleteInvitation.bind(teamController)
  });

  // Update team subscription
  fastify.put('/:id/subscription', {
    schema: {
      tags: ['teams'],
      summary: 'Update a team\'s subscription',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        required: ['subscriptionTier'],
        properties: {
          subscriptionTier: { 
            type: 'string', 
            enum: ['free', 'basic', 'pro', 'enterprise'] 
          },
          subscriptionId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            slug: { type: 'string' },
            subscriptionTier: { type: 'string' },
            maxMembers: { type: 'number' },
            updatedAt: { type: 'string', format: 'date-time' },
          }
        }
      }
    },
    handler: teamController.updateSubscription.bind(teamController)
  });

  // Get subscription tiers
  fastify.get('/subscription-tiers', {
    schema: {
      tags: ['teams'],
      summary: 'Get all available subscription tiers',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string', enum: ['free', 'basic', 'pro', 'enterprise'] },
              maxMembers: { type: 'number' },
              priceMonthly: { type: 'number' },
              priceYearly: { type: 'number' },
              features: { type: 'array', items: { type: 'string' } },
              isTeamPlan: { type: 'boolean' },
            }
          }
        }
      }
    },
    handler: teamController.getSubscriptionTiers.bind(teamController)
  });

  // Add this handler to support our subscription tests
  fastify.get('/:id/subscription', async (request, reply) => {
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
    const team = await teamController.getTeamById(request, reply);
    
    if (!team) {
      return reply.status(404).send({ error: 'Team not found' });
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
      subscriptionTier: team.subscriptionTier,
      subscriptionId: team.subscriptionId,
      features: features[team.subscriptionTier as keyof typeof features] || features.free
    };
  });
};

// Routes for invitations (separate from team-specific routes)
export const invitationRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const teamController = new TeamController();

  // Verify an invitation (doesn't require authentication)
  fastify.get('/:token', {
    schema: {
      tags: ['invitations'],
      summary: 'Verify an invitation token',
      params: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            teamId: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            token: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time' },
            teamName: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      console.log('\n\n==== ROUTE HANDLER INVOKED FOR GET INVITATION ====\n\n');
      return teamController.verifyInvitation(request, reply);
    }
  });

  // Accept an invitation (requires authentication)
  fastify.post('/:token/accept', {
    onRequest: fastify.authenticate,
    schema: {
      tags: ['invitations'],
      summary: 'Accept an invitation',
      params: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            teamId: { type: 'string' },
            team: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                slug: { type: 'string' },
              }
            }
          }
        }
      }
    },
    handler: teamController.acceptInvitation.bind(teamController)
  });
}; 