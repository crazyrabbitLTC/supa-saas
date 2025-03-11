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
  Team, TeamMember, TeamInvitation, 
  TeamRole, SubscriptionTier, SubscriptionTierRecord
} from '../types/teams';
import { snakeToCamel, camelToSnake } from '../types/helpers';
import { TableRow, TableInsert } from '../types';

// Define SubscriptionTierInfo as an alias for backward compatibility
type SubscriptionTierInfo = SubscriptionTierRecord;

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
    // Use supabaseAdmin to bypass RLS policies
    const { data, error } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      // PGRST116 is the error code for "no rows returned" in v2
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get team: ${error.message}`);
    }
    
    return data ? (snakeToCamel(data) as Team) : null;
  }

  /**
   * Get a team by slug
   */
  async getTeamBySlug(slug: string): Promise<Team | null> {
    // Use supabaseAdmin to bypass RLS policies
    const { data, error } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get team by slug: ${error.message}`);
    }
    
    return data ? (snakeToCamel(data) as Team) : null;
  }

  /**
   * Get all teams for a user
   */
  async getUserTeams(userId: string): Promise<Team[]> {
    // Use supabaseAdmin to bypass RLS policies
    const { data, error } = await supabaseAdmin
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
    try {
      console.log(`[DEBUG] deleteTeam: Checking if team ${id} exists and is not personal`);
      
      // First check if the team exists and is not a personal team
      const { data: team, error: fetchError } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error(`[ERROR] deleteTeam: Error fetching team ${id}:`, fetchError);
        if (fetchError.code === 'PGRST116') {
          console.log(`[DEBUG] deleteTeam: Team ${id} not found`);
          return false; // Team not found
        }
        throw new Error(`Failed to check team: ${fetchError.message}`);
      }
      
      console.log(`[DEBUG] deleteTeam: Team ${id} found, is_personal: ${team.is_personal}`);
      
      if (team.is_personal) {
        console.log(`[WARN] deleteTeam: Cannot delete personal team ${id}`);
        throw new Error('Cannot delete a personal team');
      }
      
      try {
        // Delete the team
        console.log(`[DEBUG] deleteTeam: Deleting team ${id}`);
        const { error } = await supabaseAdmin
          .from('teams')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error(`[ERROR] deleteTeam: Error deleting team ${id}:`, error);
          
          // Handle specific error messages
          if (error.message && error.message.includes('last owner')) {
            throw new Error('Cannot remove the last owner of a team');
          }
          
          throw new Error(`Failed to delete team: ${error.message}`);
        }
        
        console.log(`[DEBUG] deleteTeam: Successfully deleted team ${id}`);
        return true;
      } catch (deleteError: any) {
        // Re-throw specific errors we want to handle at the controller level
        if (deleteError.message && (
          deleteError.message.includes('last owner') || 
          deleteError.message.includes('Cannot remove')
        )) {
          console.log(`[WARN] deleteTeam: Cannot delete team - ${deleteError.message}`);
          throw deleteError;
        }
        
        throw new Error(`Failed to delete team: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`);
      }
    } catch (error: any) {
      console.error(`[ERROR] deleteTeam: Exception deleting team ${id}:`, error);
      
      // Re-throw specific error types we want to handle specially
      if (error instanceof Error && (
        error.message === 'Cannot delete a personal team' ||
        error.message.includes('last owner') ||
        error.message.includes('Cannot remove')
      )) {
        throw error;
      }
      
      throw new Error(`Failed to delete team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all members of a team
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    // Use supabaseAdmin to bypass RLS policies
    const { data, error } = await supabaseAdmin
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
    const { data: existingMember, error: checkError } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      throw new Error(`Failed to check existing member: ${checkError.message}`);
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
    // First check if member exists
    const { data: owners, error: checkError } = await supabaseAdmin
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      throw new Error(`Failed to check team member: ${checkError.message}`);
    }
    
    if (!owners) {
      return null; // Member not found
    }
    
    // Update the member's role
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
    const { data: owners, error: checkError } = await supabaseAdmin
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
    // Use supabaseAdmin instead of supabaseClient to bypass RLS policies
    const { data, error } = await supabaseAdmin
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
    // Use supabaseAdmin instead of supabaseClient to bypass RLS policies
    // This prevents the infinite recursion in the team_members table policy
    const { data, error } = await supabaseAdmin
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
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Invitation expires in 7 days
    
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
    // Use supabaseAdmin to bypass RLS policies
    const { data, error } = await supabaseAdmin
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
    const { data: invitation, error: invitationError } = await supabaseAdmin
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
    
    // Check if the invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return null; // Invitation expired
    }
    
    return snakeToCamel(invitation) as TeamInvitation;
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation({ token, userId }: AcceptInvitationParams): Promise<string | null> {
    // Get the invitation
    const { data: invitation, error: invitationError } = await supabaseAdmin
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
    const { data: tier, error: tierError } = await supabaseAdmin
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
   * Get subscription tier by ID
   */
  async getSubscriptionTier(tierId: SubscriptionTier): Promise<SubscriptionTierInfo | null> {
    const { data: tier, error: tierError } = await supabaseAdmin
      .from('subscription_tiers')
      .select('*')
      .eq('id', tierId)
      .single();
    
    if (tierError) {
      if (tierError.code === 'PGRST116') {
        return null; // Tier not found
      }
      throw new Error(`Failed to get subscription tier: ${tierError.message}`);
    }
    
    return snakeToCamel(tier) as SubscriptionTierInfo;
  }

  /**
   * Get all subscription tiers
   */
  async getSubscriptionTiers(): Promise<SubscriptionTierInfo[]> {
    console.log('[DEBUG] getSubscriptionTiers: Fetching subscription tiers');
    
    try {
      // Query subscription tiers without ordering to avoid column errors
      const { data, error } = await supabaseAdmin
        .from('subscription_tiers')
        .select('*');
      
      if (error) {
        console.error('[ERROR] getSubscriptionTiers: Failed to get subscription tiers:', error);
        throw new Error(`Failed to get subscription tiers: ${error.message}`);
      }
      
      console.log(`[DEBUG] getSubscriptionTiers: Found ${data?.length || 0} subscription tiers`);
      
      // Sort the data in memory based on price_monthly to avoid SQL errors
      const sortedData = [...data].sort((a, b) => 
        (a.price_monthly || 0) - (b.price_monthly || 0)
      );
      
      return sortedData.map(tier => snakeToCamel(tier) as SubscriptionTierInfo);
    } catch (error: any) {
      console.error('[ERROR] getSubscriptionTiers: Exception fetching subscription tiers:', error);
      throw new Error(`Failed to get subscription tiers: ${error.message}`);
    }
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