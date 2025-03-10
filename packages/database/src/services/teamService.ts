/**
 * @file Team Service
 * @version 0.2.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-05-11
 * 
 * Service for managing teams, team members, and team invitations using Supabase.
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

import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin, supabaseClient } from '../client';
import { 
  Team, TeamMember, TeamInvitation, SubscriptionTierRecord,
  TeamRole, SubscriptionTier,
  NewTeam, NewTeamMember, NewTeamInvitation,
  TeamRow, TeamMemberRow, TeamInvitationRow,
  snakeToCamel, camelToSnake
} from '../types';

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
  createdBy: string;
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
    
    // Create the team
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .insert({
        name,
        slug: teamSlug,
        description,
        logo_url: logoUrl,
        is_personal: false,
        subscription_tier: SubscriptionTier.FREE,
      })
      .select()
      .single();
    
    if (teamError) {
      throw new Error(`Failed to create team: ${teamError.message}`);
    }
    
    // Add creator as team owner
    const { error: memberError } = await supabaseAdmin
      .from('team_members')
      .insert({
        team_id: team.id,
        user_id: userId,
        role: TeamRole.OWNER,
      });
    
    if (memberError) {
      // Rollback team creation
      await supabaseAdmin.from('teams').delete().eq('id', team.id);
      throw new Error(`Failed to add team owner: ${memberError.message}`);
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
   * Get all teams a user is a member of
   */
  async getUserTeams(userId: string): Promise<Team[]> {
    const { data, error } = await supabaseClient
      .from('teams')
      .select('*, team_members!inner(*)')
      .eq('team_members.user_id', userId);
    
    if (error) {
      throw new Error(`Failed to get user teams: ${error.message}`);
    }
    
    // Remove the team_members from the result
    const teams = data.map(team => {
      const { team_members, ...rest } = team;
      return rest;
    });
    
    return teams.map(team => snakeToCamel(team) as Team);
  }

  /**
   * Update a team's details
   */
  async updateTeam({ id, name, description, logoUrl, metadata }: UpdateTeamParams): Promise<Team | null> {
    const updates: Partial<TeamRow> = {};
    
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (logoUrl !== undefined) updates.logo_url = logoUrl;
    if (metadata !== undefined) updates.metadata = metadata;
    
    updates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabaseClient
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update team: ${error.message}`);
    }
    
    return snakeToCamel(data) as Team;
  }

  /**
   * Delete a team (non-personal teams only)
   */
  async deleteTeam(id: string): Promise<boolean> {
    // First check if it's a personal team
    const { data: team, error: getError } = await supabaseClient
      .from('teams')
      .select('is_personal')
      .eq('id', id)
      .single();
    
    if (getError) {
      throw new Error(`Failed to check team: ${getError.message}`);
    }
    
    if (team.is_personal) {
      throw new Error('Cannot delete personal teams');
    }
    
    const { error } = await supabaseClient
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
    try {
      const { data, error } = await supabaseClient
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to add team member: ${error.message}`);
      }
      
      return snakeToCamel(data) as TeamMember;
    } catch (error: any) {
      console.error('Error adding team member:', error);
      return null;
    }
  }

  /**
   * Update a team member's role
   */
  async updateTeamMember({ teamId, userId, role }: UpdateTeamMemberParams): Promise<TeamMember | null> {
    const { data, error } = await supabaseClient
      .from('team_members')
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .select()
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
    // First check if this is the last owner
    const { data: owners, error: checkError } = await supabaseClient
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('role', TeamRole.OWNER);
    
    if (checkError) {
      throw new Error(`Failed to check team owners: ${checkError.message}`);
    }
    
    // If this is the last owner and we're trying to remove them, prevent it
    if (owners.length === 1 && owners[0].user_id === userId && owners[0].role === TeamRole.OWNER) {
      throw new Error('Cannot remove the last owner of a team');
    }
    
    const { error } = await supabaseClient
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
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return false; // Not found
      }
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
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return false; // Not found
      }
      throw new Error(`Failed to check team role: ${error.message}`);
    }
    
    return data.role === role;
  }

  /**
   * Create an invitation to join a team
   */
  async inviteToTeam({ teamId, email, role, createdBy }: InviteToTeamParams): Promise<TeamInvitation | null> {
    try {
      const { data, error } = await supabaseClient
        .from('team_invitations')
        .insert({
          team_id: teamId,
          email,
          role,
          created_by: createdBy,
          token: uuidv4(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to create invitation: ${error.message}`);
      }
      
      return snakeToCamel(data) as TeamInvitation;
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      return null;
    }
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
   * Accept an invitation and add the user to the team
   */
  async acceptInvitation({ token, userId }: AcceptInvitationParams): Promise<string | null> {
    // Get the invitation
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('team_invitations')
      .select('*')
      .eq('token', token)
      .single();
    
    if (inviteError) {
      throw new Error(`Failed to get invitation: ${inviteError.message}`);
    }
    
    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('Invitation has expired');
    }
    
    // Add user to team
    const { error: memberError } = await supabaseClient
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
    const { error: deleteError } = await supabaseClient
      .from('team_invitations')
      .delete()
      .eq('id', invitation.id);
    
    if (deleteError) {
      console.error('Failed to delete invitation:', deleteError);
      // Continue anyway, the user has been added to the team
    }
    
    return invitation.team_id;
  }

  /**
   * Delete an invitation
   */
  async deleteInvitation(id: string): Promise<boolean> {
    const { error } = await supabaseClient
      .from('team_invitations')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete invitation: ${error.message}`);
    }
    
    return true;
  }

  /**
   * Change a team's subscription tier
   */
  async changeSubscription({ teamId, subscriptionTier, subscriptionId }: ChangeSubscriptionParams): Promise<Team | null> {
    const updates: Partial<TeamRow> = {
      subscription_tier: subscriptionTier,
      updated_at: new Date().toISOString(),
    };
    
    if (subscriptionId !== undefined) {
      updates.subscription_id = subscriptionId;
    }
    
    // Get the max members for this tier
    const { data: tierData, error: tierError } = await supabaseClient
      .from('subscription_tiers')
      .select('max_members')
      .eq('name', subscriptionTier)
      .single();
    
    if (tierError) {
      throw new Error(`Failed to get subscription tier: ${tierError.message}`);
    }
    
    updates.max_members = tierData.max_members;
    
    const { data, error } = await supabaseClient
      .from('teams')
      .update(updates)
      .eq('id', teamId)
      .select()
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
   * Generate a slug from a name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

export const teamService = new TeamService(); 