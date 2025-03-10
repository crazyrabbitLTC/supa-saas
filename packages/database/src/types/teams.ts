/**
 * @file Team Types
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Type definitions for team-related entities.
 * 
 * IMPORTANT:
 * - These types are based on the database schema
 * - Use these types when working with team data
 * 
 * Functionality:
 * - Provides TypeScript types for teams, members, and invitations
 * - Includes both database (snake_case) and application (camelCase) versions
 */

import { Database } from './supabase';
import { SnakeToCamelObject } from './helpers';

// Enum Types
export const TeamRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

export const SubscriptionTier = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

export type TeamRole = (typeof TeamRole)[keyof typeof TeamRole];
export type SubscriptionTier = (typeof SubscriptionTier)[keyof typeof SubscriptionTier];

// Database Types (snake_case)
export type TeamRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_personal: boolean;
  personal_user_id: string | null;
  subscription_tier: SubscriptionTier;
  subscription_id: string | null;
  max_members: number;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

export type TeamMemberRow = {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  created_at: string;
  updated_at: string;
};

export type TeamInvitationRow = {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  token: string;
  created_by: string;
  expires_at: string;
  created_at: string;
};

export type SubscriptionTierRow = {
  id: string;
  name: SubscriptionTier;
  max_members: number;
  max_resources: Record<string, any> | null;
  price_monthly: number;
  price_yearly: number;
  features: string[] | null;
  is_team_plan: boolean;
  created_at: string;
  updated_at: string;
};

export type TeamAnalyticsRow = {
  id: string;
  team_id: string;
  month: string;
  active_users: number;
  resource_usage: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};

// Application Types (camelCase)
export type Team = SnakeToCamelObject<TeamRow>;
export type TeamMember = SnakeToCamelObject<TeamMemberRow>;
export type TeamInvitation = SnakeToCamelObject<TeamInvitationRow>;
export type SubscriptionTierRecord = SnakeToCamelObject<SubscriptionTierRow>;
export type SubscriptionTierInfo = SubscriptionTierRecord; // Alias for backward compatibility
export type TeamAnalytics = SnakeToCamelObject<TeamAnalyticsRow>;

// Insert Types
export type TeamInsert = Omit<TeamRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type TeamMemberInsert = Omit<TeamMemberRow, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type TeamInvitationInsert = Omit<TeamInvitationRow, 'id' | 'created_at'> & { id?: string };

// Update Types
export type TeamUpdate = Partial<Omit<TeamRow, 'id' | 'created_at'>>;
export type TeamMemberUpdate = Partial<Omit<TeamMemberRow, 'id' | 'team_id' | 'user_id' | 'created_at'>>;
export type TeamInvitationUpdate = Partial<Omit<TeamInvitationRow, 'id' | 'team_id' | 'created_at'>>;

// Application Insert/Update Types (camelCase)
export type NewTeam = SnakeToCamelObject<TeamInsert>;
export type NewTeamMember = SnakeToCamelObject<TeamMemberInsert>;
export type NewTeamInvitation = SnakeToCamelObject<TeamInvitationInsert>;
export type UpdateTeam = SnakeToCamelObject<TeamUpdate>;
export type UpdateTeamMember = SnakeToCamelObject<TeamMemberUpdate>;
export type UpdateTeamInvitation = SnakeToCamelObject<TeamInvitationUpdate>; 