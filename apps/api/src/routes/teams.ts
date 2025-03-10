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

export const teamRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const teamController = new TeamController();

  // Require authentication for all team routes
  fastify.addHook('onRequest', fastify.authenticate);

  // Helper function to add owner information to team responses
  const formatTeamResponse = async (team: any, db: any) => {
    if (!team) return team;
    
    try {
      // Find the owner of the team
      const query = `
        SELECT user_id 
        FROM team_members 
        WHERE team_id = $1 AND role = 'owner' 
        LIMIT 1
      `;
      const result = await db.executeRawQuery(query, [team.id]);
      if (result && result.rows && result.rows.length > 0) {
        team.ownerId = result.rows[0].user_id;
      }
    } catch (error) {
      console.error('Error finding team owner:', error);
    }
    
    return team;
  };

  // Format team arrays before sending
  const formatTeamsArray = async (teams: any[], db: any) => {
    return Promise.all(teams.map(team => formatTeamResponse(team, db)));
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
   * GET /teams
   * Get all teams for the current user
   */
  fastify.get('/', async (request, reply) => {
    const controller = new TeamController();
    const response = await controller.getUserTeams(request, reply);
    
    // If the response has already been sent, return it as is
    if (reply.sent) return response;
    
    // Format the teams before sending if it's an array
    if (Array.isArray(response)) {
      const formattedTeams = await formatTeamsArray(response, fastify.db);
      return reply.send(formattedTeams);
    }
    
    return response;
  });

  /**
   * POST /teams
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
          }
        }
      }
    },
  }, async (request, reply) => {
    const response = await teamController.createTeam(request, reply);
    
    // If the response has already been sent, return it as is
    if (reply.sent) return response;
    
    // Format the team response
    if (response && !Array.isArray(response)) {
      const formattedTeam = await formatTeamResponse(response, fastify.db);
      return reply.send(formattedTeam);
    }
    
    return response;
  });

  /**
   * GET /teams/:id
   * Get a team by ID
   */
  fastify.get('/:id', async (request, reply) => {
    const response = await teamController.getTeamById(request, reply);
    
    // If the response has already been sent, return it as is
    if (reply.sent) return response;
    
    // Format the team response
    if (response && !Array.isArray(response)) {
      const formattedTeam = await formatTeamResponse(response, fastify.db);
      return reply.send(formattedTeam);
    }
    
    return response;
  });

  // Update a team
  fastify.put('/:id', {
    schema: {
      tags: ['teams'],
      summary: 'Update a team',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          logoUrl: { type: 'string', format: 'uri' },
          metadata: { type: 'object' },
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
          }
        }
      }
    },
    handler: teamController.updateTeam.bind(teamController)
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
            valid: { type: 'boolean' },
            invitation: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                teamId: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                expiresAt: { type: 'string', format: 'date-time' },
              }
            }
          }
        }
      }
    },
    handler: teamController.verifyInvitation.bind(teamController)
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