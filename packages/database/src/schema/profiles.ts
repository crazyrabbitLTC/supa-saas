/**
 * @file Profiles Schema
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Defines the profiles table schema using Drizzle ORM.
 * 
 * IMPORTANT:
 * - Any schema changes must be accompanied by migrations
 * - Ensure tests are updated for any schema changes
 * 
 * Functionality:
 * - Defines profiles table structure
 * - Provides type definitions for profiles
 */

import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  username: text('username').unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  website: text('website'),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert; 