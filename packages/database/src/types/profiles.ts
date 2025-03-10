/**
 * @file Profile Types
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Type definitions for profile-related entities.
 * 
 * IMPORTANT:
 * - These types are based on the database schema
 * - Use these types when working with profile data
 * 
 * Functionality:
 * - Provides TypeScript types for profiles
 * - Includes both database (snake_case) and application (camelCase) versions
 */

import { Database } from './supabase';
import { SnakeToCamelObject } from './helpers';

// Database Types (snake_case)
export type ProfileRow = {
  id: string;
  updated_at: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
};

// Application Types (camelCase)
export type Profile = SnakeToCamelObject<ProfileRow>;

// Insert Types
export type ProfileInsert = Omit<ProfileRow, 'updated_at'>;

// Update Types
export type ProfileUpdate = Partial<Omit<ProfileRow, 'id'>>;

// Application Insert/Update Types (camelCase)
export type NewProfile = SnakeToCamelObject<ProfileInsert>;
export type UpdateProfile = SnakeToCamelObject<ProfileUpdate>; 