/**
 * @file Team Controller
 * @version 0.1.0
 * @status DRAFT
 * @lastModified 2023-05-11
 * 
 * Controller for team-related API endpoints.
 * 
 * IMPORTANT:
 * - All operations respect RLS policies through the Supabase client
 * - Authentication is required for all endpoints
 * 
 * Functionality:
 * - Team CRUD operations
 * - Team member management
 * - Team invitations handling
 * - Subscription management
 */

import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { z } from 'zod';
import { teamService } from 'database/src/services/teamService';
import { TeamRole, SubscriptionTier } from 'database/src/schema/teams';

// Request body schemas
const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const inviteToTeamSchema = z.object({
  email: z.string().email(),
  role: z.enum([TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER]),
});

const updateMemberRoleSchema = z.object({
  role: z.enum([TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER]),
});

const updateSubscriptionSchema = z.object({
  subscriptionTier: z.enum([
    SubscriptionTier.FREE,
    SubscriptionTier.BASIC,
    SubscriptionTier.PRO,
    SubscriptionTier.ENTERPRISE,
  ]),
  subscriptionId: z.string().optional(),
});

export class TeamController {
  /**
   * Create a new team
   */
  async createTeam(request: FastifyRequest<{ Body: z.infer<typeof createTeamSchema> }>, reply: FastifyReply) {
    try {
      const { name, slug, description, logoUrl } = request.body;
      const userId = request.user.id;

      const team = await teamService.createTeam({
        name,
        slug,
        description,
        logoUrl,
        userId,
      });

      return reply.code(201).send(team);
    } catch (error: any) {
      request.log.error(error, 'Error creating team');
      return reply.code(500).send({ 
        error: 'Failed to create team',
        message: error.message 
      });
    }
  }

  /**
   * Get all teams for the current user
   */
  async getUserTeams(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;
      const teams = await teamService.getUserTeams(userId);

      return reply.send(teams);
    } catch (error: any) {
      request.log.error(error, 'Error getting user teams');
      return reply.code(500).send({ 
        error: 'Failed to retrieve teams',
        message: error.message 
      });
    }
  }

  /**
   * Get a team by ID
   */
  async getTeamById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const team = await teamService.getTeamById(id);

      if (!team) {
        return reply.code(404).send({ error: 'Team not found' });
      }

      return reply.send(team);
    } catch (error: any) {
      request.log.error(error, 'Error getting team');
      return reply.code(500).send({ 
        error: 'Failed to retrieve team',
        message: error.message 
      });
    }
  }

  /**
   * Update a team
   */
  async updateTeam(
    request: FastifyRequest<{ 
      Params: { id: string },
      Body: z.infer<typeof updateTeamSchema>
    }>, 
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { name, description, logoUrl, metadata } = request.body;
      const userId = request.user.id;

      // Check if user is team owner
      const isOwner = await teamService.hasTeamRole(id, userId, TeamRole.OWNER);
      if (!isOwner) {
        return reply.code(403).send({ error: 'Only team owners can update team details' });
      }

      const updatedTeam = await teamService.updateTeam({
        id,
        name,
        description,
        logoUrl,
        metadata,
      });

      if (!updatedTeam) {
        return reply.code(404).send({ error: 'Team not found' });
      }

      return reply.send(updatedTeam);
    } catch (error: any) {
      request.log.error(error, 'Error updating team');
      return reply.code(500).send({ 
        error: 'Failed to update team',
        message: error.message 
      });
    }
  }

  /**
   * Delete a team
   */
  async deleteTeam(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      // Check if user is team owner
      const isOwner = await teamService.hasTeamRole(id, userId, TeamRole.OWNER);
      if (!isOwner) {
        return reply.code(403).send({ error: 'Only team owners can delete teams' });
      }

      const deleted = await teamService.deleteTeam(id);

      if (!deleted) {
        return reply.code(404).send({ error: 'Team not found or could not be deleted' });
      }

      return reply.code(204).send();
    } catch (error: any) {
      request.log.error(error, 'Error deleting team');
      return reply.code(500).send({ 
        error: 'Failed to delete team',
        message: error.message 
      });
    }
  }

  /**
   * Get all members of a team
   */
  async getTeamMembers(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      // Check if user is team member
      const isMember = await teamService.isTeamMember(id, userId);
      if (!isMember) {
        return reply.code(403).send({ error: 'You must be a team member to view this information' });
      }

      const members = await teamService.getTeamMembers(id);

      return reply.send(members);
    } catch (error: any) {
      request.log.error(error, 'Error getting team members');
      return reply.code(500).send({ 
        error: 'Failed to retrieve team members',
        message: error.message 
      });
    }
  }

  /**
   * Invite a user to a team
   */
  async inviteToTeam(
    request: FastifyRequest<{ 
      Params: { id: string },
      Body: z.infer<typeof inviteToTeamSchema>
    }>, 
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { email, role } = request.body;
      const userId = request.user.id;

      // Check if user is team owner or admin
      const isOwnerOrAdmin = await teamService.hasTeamRole(id, userId, TeamRole.OWNER) || 
                             await teamService.hasTeamRole(id, userId, TeamRole.ADMIN);
      
      if (!isOwnerOrAdmin) {
        return reply.code(403).send({ error: 'Only team owners and admins can invite members' });
      }

      // Non-owners can't make new owners
      if (role === TeamRole.OWNER && !await teamService.hasTeamRole(id, userId, TeamRole.OWNER)) {
        return reply.code(403).send({ error: 'Only team owners can invite new owners' });
      }

      const invitation = await teamService.inviteToTeam({
        teamId: id,
        email,
        role,
        invitedBy: userId,
      });

      if (!invitation) {
        return reply.code(400).send({ error: 'Failed to create invitation' });
      }

      // TODO: Send invitation email

      return reply.code(201).send(invitation);
    } catch (error: any) {
      request.log.error(error, 'Error inviting to team');
      return reply.code(500).send({ 
        error: 'Failed to invite to team',
        message: error.message 
      });
    }
  }

  /**
   * Get pending invitations for a team
   */
  async getTeamInvitations(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      // Check if user is team owner or admin
      const isOwnerOrAdmin = await teamService.hasTeamRole(id, userId, TeamRole.OWNER) || 
                             await teamService.hasTeamRole(id, userId, TeamRole.ADMIN);
      
      if (!isOwnerOrAdmin) {
        return reply.code(403).send({ error: 'Only team owners and admins can view invitations' });
      }

      const invitations = await teamService.getTeamInvitations(id);

      return reply.send(invitations);
    } catch (error: any) {
      request.log.error(error, 'Error getting team invitations');
      return reply.code(500).send({ 
        error: 'Failed to retrieve team invitations',
        message: error.message 
      });
    }
  }

  /**
   * Delete an invitation
   */
  async deleteInvitation(
    request: FastifyRequest<{ 
      Params: { id: string, invitationId: string } 
    }>, 
    reply: FastifyReply
  ) {
    try {
      const { id, invitationId } = request.params;
      const userId = request.user.id;

      // Check if user is team owner or admin
      const isOwnerOrAdmin = await teamService.hasTeamRole(id, userId, TeamRole.OWNER) || 
                             await teamService.hasTeamRole(id, userId, TeamRole.ADMIN);
      
      if (!isOwnerOrAdmin) {
        return reply.code(403).send({ error: 'Only team owners and admins can delete invitations' });
      }

      const deleted = await teamService.deleteInvitation(invitationId);

      if (!deleted) {
        return reply.code(404).send({ error: 'Invitation not found' });
      }

      return reply.code(204).send();
    } catch (error: any) {
      request.log.error(error, 'Error deleting invitation');
      return reply.code(500).send({ 
        error: 'Failed to delete invitation',
        message: error.message 
      });
    }
  }

  /**
   * Verify an invitation token
   */
  async verifyInvitation(request: FastifyRequest<{ Params: { token: string } }>, reply: FastifyReply) {
    try {
      const { token } = request.params;
      
      const invitation = await teamService.getInvitationByToken(token);

      if (!invitation) {
        return reply.code(404).send({ error: 'Invitation not found or expired' });
      }

      return reply.send({ valid: true, invitation });
    } catch (error: any) {
      request.log.error(error, 'Error verifying invitation');
      return reply.code(500).send({ 
        error: 'Failed to verify invitation',
        message: error.message 
      });
    }
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(request: FastifyRequest<{ Params: { token: string } }>, reply: FastifyReply) {
    try {
      const { token } = request.params;
      const userId = request.user.id;

      const teamId = await teamService.acceptInvitation({
        token,
        userId,
      });

      if (!teamId) {
        return reply.code(400).send({ error: 'Failed to accept invitation' });
      }

      const team = await teamService.getTeamById(teamId);

      return reply.send({ success: true, team });
    } catch (error: any) {
      request.log.error(error, 'Error accepting invitation');
      return reply.code(500).send({ 
        error: 'Failed to accept invitation',
        message: error.message 
      });
    }
  }

  /**
   * Update a team member's role
   */
  async updateMemberRole(
    request: FastifyRequest<{ 
      Params: { id: string, userId: string },
      Body: z.infer<typeof updateMemberRoleSchema>
    }>, 
    reply: FastifyReply
  ) {
    try {
      const { id, userId: targetUserId } = request.params;
      const { role } = request.body;
      const userId = request.user.id;

      // Check if user is team owner (admins can only update to 'member')
      const isOwner = await teamService.hasTeamRole(id, userId, TeamRole.OWNER);
      const isAdmin = await teamService.hasTeamRole(id, userId, TeamRole.ADMIN);
      
      // Check role change permissions
      if (!isOwner && (role === TeamRole.OWNER || role === TeamRole.ADMIN)) {
        return reply.code(403).send({ error: 'Only team owners can assign owner or admin roles' });
      }
      
      if (!isOwner && !isAdmin) {
        return reply.code(403).send({ error: 'Only team owners and admins can update member roles' });
      }

      // Check for target user role
      const targetCurrentRole = await teamService.hasTeamRole(id, targetUserId, TeamRole.OWNER);
      
      // Prevent changing role of the last owner
      if (targetCurrentRole && role !== TeamRole.OWNER) {
        // Count owners
        const members = await teamService.getTeamMembers(id);
        const ownerCount = members.filter(m => m.role === TeamRole.OWNER).length;
        
        if (ownerCount <= 1) {
          return reply.code(400).send({ error: 'Cannot change the role of the last owner' });
        }
      }

      const updatedMember = await teamService.updateTeamMember({
        teamId: id,
        userId: targetUserId,
        role,
      });

      if (!updatedMember) {
        return reply.code(404).send({ error: 'Team member not found' });
      }

      return reply.send(updatedMember);
    } catch (error: any) {
      request.log.error(error, 'Error updating member role');
      return reply.code(500).send({ 
        error: 'Failed to update member role',
        message: error.message 
      });
    }
  }

  /**
   * Remove a member from a team
   */
  async removeMember(
    request: FastifyRequest<{ 
      Params: { id: string, userId: string } 
    }>, 
    reply: FastifyReply
  ) {
    try {
      const { id, userId: targetUserId } = request.params;
      const userId = request.user.id;

      // Check if user is team owner or admin
      const isOwner = await teamService.hasTeamRole(id, userId, TeamRole.OWNER);
      const isAdmin = await teamService.hasTeamRole(id, userId, TeamRole.ADMIN);
      
      if (!isOwner && !isAdmin) {
        return reply.code(403).send({ error: 'Only team owners and admins can remove members' });
      }

      // Check if trying to remove an owner or admin
      const targetIsOwner = await teamService.hasTeamRole(id, targetUserId, TeamRole.OWNER);
      const targetIsAdmin = await teamService.hasTeamRole(id, targetUserId, TeamRole.ADMIN);
      
      // Admins can't remove owners or other admins
      if (isAdmin && !isOwner && (targetIsOwner || targetIsAdmin)) {
        return reply.code(403).send({ error: 'Admins cannot remove owners or other admins' });
      }

      // Prevent removing the last owner
      if (targetIsOwner) {
        const members = await teamService.getTeamMembers(id);
        const ownerCount = members.filter(m => m.role === TeamRole.OWNER).length;
        
        if (ownerCount <= 1) {
          return reply.code(400).send({ error: 'Cannot remove the last owner of the team' });
        }
      }

      const removed = await teamService.removeTeamMember(id, targetUserId);

      if (!removed) {
        return reply.code(404).send({ error: 'Team member not found' });
      }

      return reply.code(204).send();
    } catch (error: any) {
      request.log.error(error, 'Error removing team member');
      return reply.code(500).send({ 
        error: 'Failed to remove team member',
        message: error.message 
      });
    }
  }

  /**
   * Get all available subscription tiers
   */
  async getSubscriptionTiers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const tiers = await teamService.getSubscriptionTiers();
      return reply.send(tiers);
    } catch (error: any) {
      request.log.error(error, 'Error getting subscription tiers');
      return reply.code(500).send({ 
        error: 'Failed to retrieve subscription tiers',
        message: error.message 
      });
    }
  }

  /**
   * Update a team's subscription
   */
  async updateSubscription(
    request: FastifyRequest<{ 
      Params: { id: string },
      Body: z.infer<typeof updateSubscriptionSchema>
    }>, 
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { subscriptionTier, subscriptionId } = request.body;
      const userId = request.user.id;

      // Check if user is team owner
      const isOwner = await teamService.hasTeamRole(id, userId, TeamRole.OWNER);
      
      if (!isOwner) {
        return reply.code(403).send({ error: 'Only team owners can update subscriptions' });
      }

      const updatedTeam = await teamService.changeSubscription({
        teamId: id,
        subscriptionTier,
        subscriptionId,
      });

      if (!updatedTeam) {
        return reply.code(404).send({ error: 'Team not found or tier unavailable' });
      }

      return reply.send(updatedTeam);
    } catch (error: any) {
      request.log.error(error, 'Error updating subscription');
      return reply.code(500).send({ 
        error: 'Failed to update subscription',
        message: error.message 
      });
    }
  }
} 