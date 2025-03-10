/**
 * @file Team Service
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-10-15
 * 
 * Service for managing teams, team members, and team invitations.
 * 
 * IMPORTANT:
 * - Any changes must be accompanied by tests
 * - Maintain type safety for all operations
 * 
 * Functionality:
 * - Team CRUD operations
 * - Team member management
 * - Team invitations
 * - Subscription management
 */

import { v4 as uuidv4 } from 'uuid';
import { supabaseClient, supabaseAdmin } from '../client';
import { 
  Team, TeamMember, TeamInvitation, SubscriptionTierRecord,
  TeamRole, SubscriptionTier, 
  snakeToCamel, camelToSnake,
  TableRow, TableInsert
} from '../types';

/**
 * Parameters for creating a team
 */
interface CreateTeamParams {
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  userId: string;
}

/**
 * Parameters for updating a team
 */
interface UpdateTeamParams {
  id: string;
  name?: string;
  description?: string;
  logoUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Parameters for inviting a user to a team
 */
interface InviteToTeamParams {
  teamId: string;
  email: string;
  role: TeamRole;
  createdBy: string;
}

/**
 * Parameters for adding a team member
 */
interface AddTeamMemberParams {
  teamId: string;
  userId: string;
  role: TeamRole;
}

/**
 * Parameters for updating a team member
 */
interface UpdateTeamMemberParams {
  teamId: string;
  userId: string;
  role: TeamRole;
}

/**
 * Parameters for accepting an invitation
 */
interface AcceptInvitationParams {
  token: string;
  userId: string;
}

/**
 * Parameters for changing a team's subscription
 */
interface ChangeSubscriptionParams {
  teamId: string;
  subscriptionTier: SubscriptionTier;
  subscriptionId?: string;
}

/**
 * Service for managing teams
 */
class TeamService {
  /**
   * Create a new team
   */
  async createTeam({ name, slug, description, logoUrl, userId }: CreateTeamParams): Promise<Team> {
    // Generate a slug if not provided
    const teamSlug = slug || this.generateSlug(name);
    
    // Create the team
    const { data: team, error } = await supabaseAdmin
      .from('teams')
      .insert({
        name,
        slug: teamSlug,
        description,
        logo_url: logoUrl,
        is_personal: false,
        subscription_tier: 'free',
      })
      .select('*')
      .single();
    
    if (error) {
      throw new Error(`Failed to create team: ${error.message}`);
    }
    
    // Add the creator as an owner
    const { error: memberError } = await supabaseAdmin
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: 'owner',
      })
      .select('*')
      .single();
    
    if (memberError) {
      // Attempt to clean up the team if member creation fails
      await supabaseAdmin.from('teams').delete().eq('id', team.id);
      throw new Error(`Failed to add team member: ${memberError.message}`);
    }
    
    return snakeToCamel(team) as Team;
  }

  /**
   * Get a team by ID
   */
  async getTeamById(id: string): Promise<Team | null> {
    const { data, error } = await supabaseClient
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get team: ${error.message}`);
    }
    
    return snakeToCamel(data) as Team;
  }

  /**
   * Get a team by slug
   */
  async getTeamBySlug(slug: string): Promise<Team | null> {
    const { data, error } = await supabaseClient
      .from('teams')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get team by slug: ${error.message}`);
    }
    
    return snakeToCamel(data) as Team;
  }

  /**
   * Get all teams for a user
   */
  async getUserTeams(userId: string): Promise<Team[]> {
    const { data, error } = await supabaseClient
      .from('teams')
      .select(`
        *,
        team_members!inner(user_id)
      `)
      .eq('team_members.user_id', userId);
    
    if (error) {
      throw new Error(`Failed to get user teams: ${error.message}`);
    }
    
    return data.map(team => snakeToCamel(team) as Team);
  }

  /**
   * Update a team
   */
  async updateTeam({ id, name, description, logoUrl, metadata }: UpdateTeamParams): Promise<Team | null> {
    const updates: Record<string, any> = {};
    
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (logoUrl !== undefined) updates.logo_url = logoUrl;
    if (metadata !== undefined) updates.metadata = metadata;
    
    const { data, error } = await supabaseAdmin
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    
    if (error) {
      throw new Error(`Failed to update team: ${error.message}`);
    }
    
    return snakeToCamel(data) as Team;
  }

  /**
   * Delete a team
   */
  async deleteTeam(id: string): Promise<boolean> {
    // First check if the team exists and is not a personal team
    const { data: team, error: fetchError } = await supabaseClient
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return false; // Team not found
      }
      throw new Error(`Failed to check team: ${fetchError.message}`);
    }
    
    if (team.is_personal) {
      throw new Error('Cannot delete a personal team');
    }
    
    // Delete the team
    const { error } = await supabaseAdmin
      .from('teams')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete team: ${error.message}`);
    }
    
    return true;
  }

  /**
   * Get all members of a team
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const { data, error } = await supabaseClient
      .from('team_members')
      .select('*')
      .eq('team_id', teamId);
    
    if (error) {
      throw new Error(`Failed to get team members: ${error.message}`);
    }
    
    return data.map(member => snakeToCamel(member) as TeamMember);
  }

  /**
   * Add a member to a team
   */
  async addTeamMember({ teamId, userId, role }: AddTeamMemberParams): Promise<TeamMember | null> {
    // Check if user is already a member
    const { data: existingMember, error: checkError } = await supabaseClient
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      throw new Error(`Failed to check team membership: ${checkError.message}`);
    }
    
    if (existingMember) {
      return snakeToCamel(existingMember) as TeamMember;
    }
    
    // Add the member
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role,
      })
      .select('*')
      .single();
    
    if (error) {
      throw new Error(`Failed to add team member: ${error.message}`);
    }
    
    return snakeToCamel(data) as TeamMember;
  }

  /**
   * Update a team member's role
   */
  async updateTeamMember({ teamId, userId, role }: UpdateTeamMemberParams): Promise<TeamMember | null> {
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .update({ role })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select('*')
      .single();
    
    if (error) {
      throw new Error(`Failed to update team member: ${error.message}`);
    }
    
    return snakeToCamel(data) as TeamMember;
  }

  /**
   * Remove a member from a team
   */
  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    // Check if user is the last owner
    const { data: owners, error: checkError } = await supabaseClient
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('role', 'owner');
    
    if (checkError) {
      throw new Error(`Failed to check team owners: ${checkError.message}`);
    }
    
    // Check if this user is an owner and the last one
    const isLastOwner = owners.length === 1 && owners[0].user_id === userId && owners[0].role === 'owner';
    
    if (isLastOwner) {
      throw new Error('Cannot remove the last owner of a team');
    }
    
    // Remove the member
    const { error } = await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);
    
    if (error) {
      throw new Error(`Failed to remove team member: ${error.message}`);
    }
    
    return true;
  }

  /**
   * Check if a user is a member of a team
   */
  async isTeamMember(teamId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabaseClient
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      throw new Error(`Failed to check team membership: ${error.message}`);
    }
    
    return !!data;
  }

  /**
   * Check if a user has a specific role in a team
   */
  async hasTeamRole(teamId: string, userId: string, role: TeamRole): Promise<boolean> {
    const { data, error } = await supabaseClient
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      throw new Error(`Failed to check team role: ${error.message}`);
    }
    
    return data?.role === role;
  }

  /**
   * Invite a user to a team
   */
  async inviteToTeam({ teamId, email, role, createdBy }: InviteToTeamParams): Promise<TeamInvitation | null> {
    // Generate a unique token
    const token = uuidv4();
    
    // Set expiration date (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const { data, error } = await supabaseAdmin
      .from('team_invitations')
      .insert({
        team_id: teamId,
        email,
        role,
        token,
        created_by: createdBy,
        expires_at: expiresAt.toISOString(),
      })
      .select('*')
      .single();
    
    if (error) {
      throw new Error(`Failed to create invitation: ${error.message}`);
    }
    
    return snakeToCamel(data) as TeamInvitation;
  }

  /**
   * Get all invitations for a team
   */
  async getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
    const { data, error } = await supabaseClient
      .from('team_invitations')
      .select('*')
      .eq('team_id', teamId);
    
    if (error) {
      throw new Error(`Failed to get team invitations: ${error.message}`);
    }
    
    return data.map(invitation => snakeToCamel(invitation) as TeamInvitation);
  }

  /**
   * Get an invitation by token
   */
  async getInvitationByToken(token: string): Promise<TeamInvitation | null> {
    const { data, error } = await supabaseClient
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get invitation: ${error.message}`);
    }
    
    return snakeToCamel(data) as TeamInvitation;
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation({ token, userId }: AcceptInvitationParams): Promise<string | null> {
    // Get the invitation
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .single();
    
    if (invitationError) {
      if (invitationError.code === 'PGRST116') {
        return null; // Invitation not found
      }
      throw new Error(`Failed to get invitation: ${invitationError.message}`);
    }
    
    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('Invitation has expired');
    }
    
    // Add the user to the team
    const { error: memberError } = await supabaseAdmin
      .from('team_members')
      .insert({
        team_id: invitation.team_id,
        user_id: userId,
        role: invitation.role,
      });
    
    if (memberError) {
      throw new Error(`Failed to add team member: ${memberError.message}`);
    }
    
    // Delete the invitation
    const { error: deleteError } = await supabaseAdmin
      .from('team_invitations')
      .delete()
      .eq('id', invitation.id);
    
    if (deleteError) {
      throw new Error(`Failed to delete invitation: ${deleteError.message}`);
    }
    
    return invitation.team_id;
  }

  /**
   * Delete an invitation
   */
  async deleteInvitation(id: string): Promise<boolean> {
    const { error } = await supabaseAdmin
      .from('team_invitations')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete invitation: ${error.message}`);
    }
    
    return true;
  }

  /**
   * Change a team's subscription
   */
  async changeSubscription({ teamId, subscriptionTier, subscriptionId }: ChangeSubscriptionParams): Promise<Team | null> {
    const { data: tier, error: tierError } = await supabaseClient
      .from('subscription_tiers')
      .select('max_members')
      .eq('name', subscriptionTier)
      .single();
    
    if (tierError) {
      throw new Error(`Failed to get subscription tier: ${tierError.message}`);
    }
    
    const { data, error } = await supabaseAdmin
      .from('teams')
      .update({
        subscription_tier: subscriptionTier,
        subscription_id: subscriptionId,
        max_members: tier.max_members,
      })
      .eq('id', teamId)
      .select('*')
      .single();
    
    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
    
    return snakeToCamel(data) as Team;
  }

  /**
   * Get all subscription tiers
   */
  async getSubscriptionTiers(isTeamPlan: boolean = true): Promise<SubscriptionTierRecord[]> {
    const { data, error } = await supabaseClient
      .from('subscription_tiers')
      .select('*')
      .eq('is_team_plan', isTeamPlan)
      .order('price_monthly', { ascending: true });
    
    if (error) {
      throw new Error(`Failed to get subscription tiers: ${error.message}`);
    }
    
    return data.map(tier => snakeToCamel(tier) as SubscriptionTierRecord);
  }

  /**
   * Generate a slug from a team name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

export const teamService = new TeamService(); 