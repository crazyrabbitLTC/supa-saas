import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, uniqueIndex, foreignKey, date } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
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

// Teams Table
export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logoUrl: text('logo_url'),
  isPersonal: boolean('is_personal').notNull().default(false),
  personalUserId: uuid('personal_user_id'),
  subscriptionTier: text('subscription_tier').$type<SubscriptionTier>().notNull().default(SubscriptionTier.FREE),
  subscriptionId: text('subscription_id'),
  maxMembers: integer('max_members').notNull().default(5),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Team Members Table
export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  role: text('role').$type<TeamRole>().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    teamUserUnique: uniqueIndex('team_user_unique').on(table.teamId, table.userId),
  };
});

// Team Invitations Table
export const teamInvitations = pgTable('team_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').$type<TeamRole>().notNull().default(TeamRole.MEMBER),
  token: uuid('token').notNull().unique().defaultRandom(),
  createdBy: uuid('created_by').notNull(),
  expiresAt: timestamp('expires_at').notNull().default(sql`NOW() + INTERVAL '7 days'`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => {
  return {
    teamEmailUnique: uniqueIndex('team_email_unique').on(table.teamId, table.email),
  };
});

// Subscription Tiers Table
export const subscriptionTiers = pgTable('subscription_tiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').$type<SubscriptionTier>().notNull().unique(),
  maxMembers: integer('max_members').notNull(),
  maxResources: jsonb('max_resources'),
  priceMonthly: integer('price_monthly').notNull(),
  priceYearly: integer('price_yearly').notNull(),
  features: jsonb('features'),
  isTeamPlan: boolean('is_team_plan').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Team Analytics Table
export const teamAnalytics = pgTable('team_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  month: date('month').notNull(),
  activeUsers: integer('active_users').notNull().default(0),
  resourceUsage: jsonb('resource_usage'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    teamMonthUnique: uniqueIndex('team_month_unique').on(table.teamId, table.month),
  };
});

// Schemas for validation with Zod
export const insertTeamSchema = createInsertSchema(teams, {
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).nullish(),
  logoUrl: z.string().url().nullish(),
  metadata: z.record(z.unknown()).nullish(),
});

export const selectTeamSchema = createSelectSchema(teams);

export const insertTeamMemberSchema = createInsertSchema(teamMembers, {
  role: z.enum([TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER]),
});

export const selectTeamMemberSchema = createSelectSchema(teamMembers);

export const insertTeamInvitationSchema = createInsertSchema(teamInvitations, {
  email: z.string().email(),
  role: z.enum([TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER]),
});

export const selectTeamInvitationSchema = createSelectSchema(teamInvitations);

export const insertSubscriptionTierSchema = createInsertSchema(subscriptionTiers, {
  name: z.enum([SubscriptionTier.FREE, SubscriptionTier.BASIC, SubscriptionTier.PRO, SubscriptionTier.ENTERPRISE]),
  priceMonthly: z.number().int().min(0),
  priceYearly: z.number().int().min(0),
  maxMembers: z.number().int().min(1),
});

export const selectSubscriptionTierSchema = createSelectSchema(subscriptionTiers);

// Export types
export type Team = z.infer<typeof selectTeamSchema>;
export type NewTeam = z.infer<typeof insertTeamSchema>;

export type TeamMember = z.infer<typeof selectTeamMemberSchema>;
export type NewTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type TeamInvitation = z.infer<typeof selectTeamInvitationSchema>;
export type NewTeamInvitation = z.infer<typeof insertTeamInvitationSchema>;

export type SubscriptionTierRecord = z.infer<typeof selectSubscriptionTierSchema>;
export type NewSubscriptionTier = z.infer<typeof insertSubscriptionTierSchema>; 