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

export const teamRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const teamController = new TeamController();

  // Require authentication for all team routes
  fastify.addHook('onRequest', fastify.authenticate);

  // Get all teams for the current user
  fastify.get('/', {
    schema: {
      tags: ['teams'],
      summary: 'Get all teams for the current user',
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
            }
          }
        }
      }
    },
    handler: teamController.getUserTeams.bind(teamController)
  });

  // Create a new team
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
    handler: teamController.createTeam.bind(teamController)
  });

  // Get a single team by ID
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
    handler: teamController.getTeamById.bind(teamController)
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

  // Create team invitation
  fastify.post('/:id/invitations', {
    schema: {
      tags: ['teams'],
      summary: 'Create an invitation to join a team',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        required: ['email', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['owner', 'admin', 'member'] }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            teamId: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['owner', 'admin', 'member'] },
            token: { type: 'string' },
            createdBy: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          }
        }
      }
    },
    handler: teamController.inviteToTeam.bind(teamController)
  });

  // Get team invitations
  fastify.get('/:id/invitations', {
    schema: {
      tags: ['teams'],
      summary: 'Get all pending invitations for a team',
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
              email: { type: 'string' },
              role: { type: 'string', enum: ['owner', 'admin', 'member'] },
              token: { type: 'string' },
              createdBy: { type: 'string' },
              expiresAt: { type: 'string', format: 'date-time' },
              createdAt: { type: 'string', format: 'date-time' },
            }
          }
        }
      }
    },
    handler: teamController.getTeamInvitations.bind(teamController)
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