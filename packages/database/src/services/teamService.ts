/**
 * @file Team Service
 * @version 0.1.0
 * @status DRAFT
 * @lastModified 2023-05-11
 * 
 * Service for managing teams, team members, and team invitations.
 * 
 * IMPORTANT:
 * - All operations respect RLS policies through the Supabase client
 * - Team operations should be performed through this service
 * 
 * Functionality:
 * - Team CRUD operations
 * - Team member management
 * - Team invitations handling
 * - Subscription management
 */

import { and, eq, inArray } from 'drizzle-orm';
import { supabaseAdmin, db } from '../client';
import {
  teams, teamMembers, teamInvitations, subscriptionTiers,
  Team, NewTeam, TeamMember, NewTeamMember, TeamInvitation, NewTeamInvitation,
  TeamRole, SubscriptionTier
} from '../schema/teams';

interface CreateTeamParams {
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  userId: string;
}

interface UpdateTeamParams {
  id: string;
  name?: string;
  description?: string;
  logoUrl?: string;
  metadata?: Record<string, unknown>;
}

interface InviteToTeamParams {
  teamId: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
}

interface AddTeamMemberParams {
  teamId: string;
  userId: string;
  role: TeamRole;
}

interface UpdateTeamMemberParams {
  teamId: string;
  userId: string;
  role: TeamRole;
}

interface AcceptInvitationParams {
  token: string;
  userId: string;
}

interface ChangeSubscriptionParams {
  teamId: string;
  subscriptionTier: SubscriptionTier;
  subscriptionId?: string;
}

class TeamService {
  /**
   * Create a new team and add the creator as an owner
   */
  async createTeam({ name, slug, description, logoUrl, userId }: CreateTeamParams): Promise<Team> {
    // Generate a slug if not provided
    const teamSlug = slug || this.generateSlug(name);
    
    // Start a transaction to create team and add owner
    return await db.transaction(async (tx) => {
      // Create the team
      const [newTeam] = await tx
        .insert(teams)
        .values({
          name,
          slug: teamSlug,
          description,
          logoUrl,
          isPersonal: false,
          subscriptionTier: SubscriptionTier.FREE,
        })
        .returning();
      
      // Add creator as team owner
      await tx
        .insert(teamMembers)
        .values({
          teamId: newTeam.id,
          userId,
          role: TeamRole.OWNER,
        });
      
      return newTeam;
    });
  }

  /**
   * Get a team by ID
   */
  async getTeamById(id: string): Promise<Team | null> {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, id))
      .limit(1);
    
    return team || null;
  }

  /**
   * Get a team by slug
   */
  async getTeamBySlug(slug: string): Promise<Team | null> {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.slug, slug))
      .limit(1);
    
    return team || null;
  }

  /**
   * Get all teams a user is a member of
   */
  async getUserTeams(userId: string): Promise<Team[]> {
    const result = await db.execute(
      db.select()
        .from(teams)
        .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
        .where(eq(teamMembers.userId, userId))
    );

    return result.map(row => row.teams);
  }

  /**
   * Update a team's details
   */
  async updateTeam({ id, name, description, logoUrl, metadata }: UpdateTeamParams): Promise<Team | null> {
    const [updatedTeam] = await db
      .update(teams)
      .set({
        name,
        description,
        logoUrl,
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, id))
      .returning();
    
    return updatedTeam || null;
  }

  /**
   * Delete a team (non-personal teams only)
   */
  async deleteTeam(id: string): Promise<boolean> {
    const [deletedTeam] = await db
      .delete(teams)
      .where(and(
        eq(teams.id, id),
        eq(teams.isPersonal, false)
      ))
      .returning({ id: teams.id });
    
    return !!deletedTeam;
  }

  /**
   * Get all members of a team
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.teamId, teamId));
  }

  /**
   * Add a member to a team
   */
  async addTeamMember({ teamId, userId, role }: AddTeamMemberParams): Promise<TeamMember | null> {
    try {
      const [newMember] = await db
        .insert(teamMembers)
        .values({
          teamId,
          userId,
          role,
        })
        .returning();
      
      return newMember || null;
    } catch (error) {
      console.error('Error adding team member:', error);
      return null;
    }
  }

  /**
   * Update a team member's role
   */
  async updateTeamMember({ teamId, userId, role }: UpdateTeamMemberParams): Promise<TeamMember | null> {
    const [updatedMember] = await db
      .update(teamMembers)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId)
      ))
      .returning();
    
    return updatedMember || null;
  }

  /**
   * Remove a member from a team
   */
  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    const [removedMember] = await db
      .delete(teamMembers)
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId)
      ))
      .returning({ id: teamMembers.id });
    
    return !!removedMember;
  }

  /**
   * Check if a user is a member of a team
   */
  async isTeamMember(teamId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId)
      ))
      .limit(1);
    
    return !!member;
  }

  /**
   * Check if a user has a specific role in a team
   */
  async hasTeamRole(teamId: string, userId: string, role: TeamRole): Promise<boolean> {
    const [member] = await db
      .select({ role: teamMembers.role })
      .from(teamMembers)
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId)
      ))
      .limit(1);
    
    return member?.role === role;
  }

  /**
   * Create an invitation to join a team
   */
  async inviteToTeam({ teamId, email, role, invitedBy }: InviteToTeamParams): Promise<TeamInvitation | null> {
    try {
      const [invitation] = await db
        .insert(teamInvitations)
        .values({
          teamId,
          email,
          role,
          createdBy: invitedBy,
        })
        .returning();
      
      return invitation || null;
    } catch (error) {
      console.error('Error creating invitation:', error);
      return null;
    }
  }

  /**
   * Get pending invitations for a team
   */
  async getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
    return await db
      .select()
      .from(teamInvitations)
      .where(and(
        eq(teamInvitations.teamId, teamId),
        inArray(teamInvitations.expiresAt, new Date())
      ));
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<TeamInvitation | null> {
    const [invitation] = await db
      .select()
      .from(teamInvitations)
      .where(eq(teamInvitations.token, token))
      .limit(1);
    
    return invitation || null;
  }

  /**
   * Accept a team invitation
   */
  async acceptInvitation({ token, userId }: AcceptInvitationParams): Promise<string | null> {
    try {
      // Use the database function directly
      const { data, error } = await supabaseAdmin.rpc('accept_invitation', {
        invitation_token: token,
        accepting_user_id: userId
      });
      
      if (error) {
        console.error('Error accepting invitation:', error);
        return null;
      }
      
      return data; // Returns the team ID
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return null;
    }
  }

  /**
   * Delete an invitation
   */
  async deleteInvitation(id: string): Promise<boolean> {
    const [deletedInvitation] = await db
      .delete(teamInvitations)
      .where(eq(teamInvitations.id, id))
      .returning({ id: teamInvitations.id });
    
    return !!deletedInvitation;
  }

  /**
   * Update a team's subscription
   */
  async changeSubscription({ teamId, subscriptionTier, subscriptionId }: ChangeSubscriptionParams): Promise<Team | null> {
    // Get the subscription tier details
    const [tier] = await db
      .select()
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.name, subscriptionTier))
      .limit(1);
    
    if (!tier) {
      return null;
    }
    
    // Update the team's subscription
    const [updatedTeam] = await db
      .update(teams)
      .set({
        subscriptionTier,
        subscriptionId,
        maxMembers: tier.maxMembers,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, teamId))
      .returning();
    
    return updatedTeam || null;
  }

  /**
   * Get all available subscription tiers
   */
  async getSubscriptionTiers(isTeamPlan: boolean = true): Promise<typeof subscriptionTiers.$inferSelect[]> {
    return await db
      .select()
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.isTeamPlan, isTeamPlan))
      .orderBy(subscriptionTiers.priceMonthly);
  }

  /**
   * Generate a URL-friendly slug from a team name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' 
      + Math.random().toString(36).substring(2, 7);
  }
}

export const teamService = new TeamService();
export default teamService; 