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
import { AsyncLocalStorage } from 'async_hooks';
import fp from 'fastify-plugin';
import { z } from 'zod';
import { FastifyRequest, FastifyReply } from 'fastify';
import { teamService } from 'database';

// Common schemas
const errorResponseSchema = {
  type: 'object',
  properties: {
    error: { type: 'string' }
  },
  required: ['error']
};

const teamIdParamSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' }
  },
  required: ['id']
};

export const teamRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const teamController = new TeamController();

  // Set up request context
  if (!fastify.hasDecorator('requestContext')) {
    fastify.decorate('requestContext', new AsyncLocalStorage());
  }

  // Require authentication for all team routes
  fastify.addHook('onRequest', fastify.authenticate);

  // Helper function to add owner information to team responses
  const formatTeamResponse = (team: any) => {
    if (!team) return team;
    
    console.log(`[DEBUG] formatTeamResponse called for team id: ${team.id}, name: ${team.name}`);
    console.log(`[DEBUG] Initial team object:`, JSON.stringify(team));
    console.log(`[DEBUG] Initial team keys:`, Object.keys(team));
    
    // If ownerId already exists, use it
    if (team.ownerId) {
      return team;
    }
    
    // Check for teamMembers with owner role
    let ownerId: string | undefined = undefined;
    
    // If teamMembers are available, find the owner
    if (team.teamMembers && Array.isArray(team.teamMembers)) {
      const ownerMember = team.teamMembers.find((member: any) => member.role === 'owner');
      if (ownerMember) {
        ownerId = ownerMember.user_id;
        console.log(`[DEBUG] Found owner ${ownerId} from teamMembers`);
      }
    } 
    // For newly created teams, we know the authenticated user is the owner
    else if (team.isPersonal === false && !team.ownerId) {
      // When creating a team, we need to set the authenticated user as the owner
      // In a POST request context, fastify.user is available
      try {
        // Safeguard: check if we have direct access to userId in context
        if (fastify.requestContext && fastify.requestContext.get('userId')) {
          ownerId = fastify.requestContext.get('userId');
          console.log(`[DEBUG] Setting ownerId to authenticated user: ${ownerId}`);
        }
      } catch (error) {
        console.log(`[DEBUG] Error getting userId from context:`, error);
      }
    }
    
    // Create a new object with all the original properties
    const teamWithOwner = { ...team, ownerId };
    
    console.log(`[DEBUG] Formatted team object:`, JSON.stringify(teamWithOwner));
    console.log(`[DEBUG] Formatted team keys:`, Object.keys(teamWithOwner));
    console.log(`[DEBUG] Checking if ownerId exists and is enumerable:`, ownerId ? true : false, Object.getOwnPropertyDescriptor(teamWithOwner, 'ownerId'));
    
    return teamWithOwner;
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
          type: 'object',
          properties: {
            data: {
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
        }
      }
    },
  }, async (request, reply) => {
    try {
      console.log(`[DEBUG] GET /teams: Fetching user teams`);
      const teams = await teamController.getUserTeams(request, reply);
      
      if (reply.sent) return;
      
      console.log(`[DEBUG] GET /teams: Got ${teams.length} teams from controller`);
      
      if (teams.length > 0) {
        console.log(`[DEBUG] GET /teams: First team before formatting:`, JSON.stringify(teams[0]));
      }
      
      // Format the teams array
      const formattedTeams = await formatTeamsArray(teams);
      console.log(`[DEBUG] GET /teams: Returning ${formattedTeams.length} formatted teams`);
      
      if (formattedTeams.length > 0) {
        console.log(`[DEBUG] GET /teams: First team after formatting:`, JSON.stringify(formattedTeams[0]));
        console.log(`[DEBUG] GET /teams: First team keys:`, Object.keys(formattedTeams[0]));
        console.log(`[DEBUG] GET /teams: First team ownerId:`, formattedTeams[0].ownerId);
      }
      
      // Wrap in data property for consistency with schema
      return reply.send({ data: formattedTeams });
    } catch (error) {
      request.log.error(error, 'Error getting user teams');
      return reply.code(500).send({ error: 'Failed to get user teams' });
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
            data: {
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
      }
    },
    onRequest: [fastify.authenticate],
    preHandler: (request, reply, done) => {
      // Store the userId in the request context
      const userId = request.user.id;
      const store = new Map();
      store.set('userId', userId);
      
      fastify.requestContext.run(store, () => {
        console.log(`[DEBUG] POST /teams: Creating team for user ${userId}`);
        done();
      });
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user.id;
        console.log(`[DEBUG] POST /teams: Creating team for user ${userId}`);
        
        const team = await teamController.createTeam(request.body, userId);
        console.log(`[DEBUG] POST /teams: Original team object:`, JSON.stringify(team));
        console.log(`[DEBUG] POST /teams: Team object properties:`, Object.keys(team));
        
        console.log(`[DEBUG] POST /teams: Formatting team response for ${team.id}`);
        // Add ownerId manually for newly created teams
        const formattedTeam = formatTeamResponse({...team, ownerId: userId});
        
        console.log(`[DEBUG] POST /teams: Formatted team object:`, JSON.stringify(formattedTeam));
        console.log(`[DEBUG] POST /teams: Formatted team properties:`, Object.keys(formattedTeam));
        console.log(`[DEBUG] POST /teams: Checking if ownerId is enumerable:`, Object.getOwnPropertyDescriptor(formattedTeam, 'ownerId'));
        
        // Wrap in data property for consistency with schema
        const responseObj = { data: formattedTeam };
        console.log(`[DEBUG] POST /teams: Response object to be sent:`, JSON.stringify(responseObj));
        console.log(`[DEBUG] POST /teams: Response object properties:`, Object.keys(responseObj));
        
        return reply.code(201).send(responseObj);
      } catch (error) {
        request.log.error(`Failed to create team: ${error}`);
        return reply.code(400).send({ error: 'Failed to create team' });
      }
    }
  });

  /**
   * GET /teams/:id
   * Get a team by ID
   */
  fastify.get('/:id', {
    schema: {
      tags: ['teams'],
      summary: 'Get a team by ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
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
      }
    },
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        console.log(`[DEBUG] GET /teams/:id: Fetching team ${id}`);
        
        const team = await teamController.getTeamById(request, reply);
        
        if (reply.sent) {
          console.log(`[DEBUG] GET /teams/:id: Reply already sent`);
          return;
        }
        
        console.log(`[DEBUG] GET /teams/:id: Formatting team response for ${id}`);
        const formattedTeam = formatTeamResponse(team);
        
        console.log(`[DEBUG] GET /teams/:id: Formatted team response: `, formattedTeam);
        
        // Wrap in data property for consistency with schema
        return reply.send({ data: formattedTeam });
      } catch (error) {
        request.log.error(error, 'Error getting team by ID');
        return reply.code(500).send({ error: 'Failed to get team' });
      }
    }
  });

  /**
   * Update team details
   */
  fastify.put('/:id', {
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
            data: {
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
      }
    },
    onRequest: [fastify.authenticate],
    handler: async (request, reply) => {
      try {
        const { id } = request.params;
        console.log(`[DEBUG] PUT /teams/:id: Updating team ${id}`);
        
        const team = await teamController.updateTeam(request, reply);
        
        if (reply.sent) {
          console.log(`[DEBUG] PUT /teams/:id: Reply already sent`);
          return;
        }
        
        console.log(`[DEBUG] PUT /teams/:id: Formatting team response for ${id}`);
        const formattedTeam = formatTeamResponse(team);
        
        console.log(`[DEBUG] PUT /teams/:id: Returning formatted response for ${id}`);
        
        // Wrap in data property for consistency with schema
        return reply.send({ data: formattedTeam });
      } catch (error) {
        request.log.error(error, 'Error updating team');
        return reply.code(500).send({ error: 'Failed to update team' });
      }
    }
  });

  // Delete a team
  fastify.delete('/:id', {
    preHandler: fastify.authenticate,
    schema: {
      params: teamIdParamSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        403: errorResponseSchema,
        404: errorResponseSchema,
        500: errorResponseSchema
      }
    },
    async handler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
      try {
        const { id } = request.params;
        console.log(`[DEBUG] DELETE /teams/:id: Deleting team ${id}`);
        
        const userId = request.user.id;
        const result = await teamController.deleteTeam(id, userId);
        
        // Ensure we return the right status code
        const statusCode = result.status || (result.success ? 200 : 500);
        
        if (result.success) {
          return reply.code(statusCode).send({
            success: true,
            message: result.message || 'Team deleted successfully'
          });
        } else {
          return reply.code(statusCode).send({ 
            error: result.message || 'Failed to delete team'
          });
        }
      } catch (error) {
        console.error(`[ERROR] DELETE /teams/:id: Error deleting team:`, error);
        return reply.code(500).send({ error: 'An error occurred while deleting the team' });
      }
    }
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
          type: 'object',
          properties: {
            data: {
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
        }
      }
    },
    handler: teamController.getTeamMembers.bind(teamController)
  });

  // Add a team member
  fastify.post('/:id/members', {
    schema: {
      tags: ['teams'],
      summary: 'Add a new member to a team',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        required: ['userId', 'role'],
        properties: {
          userId: { type: 'string', format: 'uuid' },
          role: { type: 'string', enum: ['owner', 'admin', 'member'] }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                teamId: { type: 'string' },
                userId: { type: 'string' },
                role: { type: 'string', enum: ['owner', 'admin', 'member'] },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ 
      Params: { id: string },
      Body: { userId: string, role: string }
    }>, reply: FastifyReply) => {
      try {
        const { id } = request.params;
        const { userId, role } = request.body;
        const currentUserId = request.user.id;
        
        // Check if current user is admin or owner
        const isAdminOrOwner = await teamService.hasTeamRole(id, currentUserId, 'admin') || 
                               await teamService.hasTeamRole(id, currentUserId, 'owner');
        
        if (!isAdminOrOwner) {
          return reply.code(403).send({ error: 'Only team admins and owners can add members' });
        }
        
        // Add the member
        const member = await teamService.addTeamMember({ 
          teamId: id, 
          userId, 
          role: role as any 
        });
        
        if (!member) {
          return reply.code(400).send({ error: 'Failed to add team member' });
        }
        
        return reply.code(201).send({ data: member });
      } catch (error: any) {
        request.log.error(error, 'Error adding team member');
        return reply.code(500).send({ 
          error: 'Failed to add team member',
          message: error.message 
        });
      }
    }
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
            data: {
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
            data: {
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
          type: 'object',
          properties: {
            data: {
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
        }
      }
    },
    handler: teamController.getSubscriptionTiers.bind(teamController)
  });

  // Add this handler to support our subscription tests
  fastify.get('/:id/subscription', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user.id;

    // Check if user is a team member using Supabase
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('team_id', id)
      .eq('user_id', userId)
      .single();

    if (memberError || !memberData) {
      return reply.status(403).send({ error: 'Forbidden: You are not a member of this team' });
    }

    // Get team details using Supabase
    const { data: teamData, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (teamError || !teamData) {
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
      subscriptionTier: teamData.subscription_tier || 'free',
      subscriptionId: teamData.subscription_id,
      features: features[teamData.subscription_tier as keyof typeof features] || features.free
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