/**
 * @file Supabase Client
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-10-15
 * 
 * This file provides typed Supabase clients for database access.
 * 
 * IMPORTANT:
 * - Never expose the service role key in client-side code
 * - The admin client should only be used in trusted server-side code
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// @ts-ignore - Import the Database type with a more flexible structure during development
import type { Database } from './types/supabase';

// Load environment variables
dotenv.config();

/**
 * Get an environment variable with fallback
 */
const getEnvVar = (name: string, defaultValue: string = ''): string => {
  const value = process.env[name];
  if (!value) {
    if (defaultValue) return defaultValue;
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
};

/**
 * Get a Supabase admin client with service role permissions
 */
export const getSupabaseAdmin = () => {
  // @ts-ignore - Using a more flexible type during development
  return createClient<Database>(
    getEnvVar('SUPABASE_URL'),
    getEnvVar('SUPABASE_SERVICE_ROLE_KEY')
  );
};

/**
 * Get a Supabase client with anonymous permissions
 */
export const getSupabaseClient = () => {
  // @ts-ignore - Using a more flexible type during development
  return createClient<Database>(
    getEnvVar('SUPABASE_URL'),
    getEnvVar('SUPABASE_ANON_KEY')
  );
};

// Create the Supabase clients
// @ts-ignore - Using a more flexible type during development
export const supabaseAdmin: SupabaseClient<Database> = getSupabaseAdmin();
// @ts-ignore - Using a more flexible type during development
export const supabaseClient: SupabaseClient<Database> = getSupabaseClient();

// Export a function to execute raw SQL queries
export const executeRawQuery = async (query: string, params: any[] = []) => {
  // @ts-ignore - Supabase types don't include custom RPC functions
  const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql_query: query, params });
  
  if (error) {
    throw new Error(`Failed to execute query: ${error.message}`);
  }
  
  return data;
}; 