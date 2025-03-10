/**
 * @file Database Client
 * @version 0.2.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Provides database client instances for Supabase.
 * 
 * IMPORTANT:
 * - Use the appropriate client for your use case
 * - The Supabase admin client is for server-side operations
 * - The Supabase client is for client-side operations
 * 
 * Functionality:
 * - Creates and exports Supabase clients
 * - Provides typed query interfaces
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types/supabase';

// DIAGNOSTIC: Log when database client is being initialized
console.log('[DATABASE] Initializing database client module');

// Get environment variables (with fallbacks)
const getEnvVar = (name: string, defaultValue: string = ''): string => {
  const value = process.env[name] || defaultValue;
  // Log for diagnostic purposes
  console.log(`[DATABASE] Environment variable ${name}: ${value ? (name.includes('KEY') ? '[SET]' : value) : '[NOT SET]'}`);
  return value;
};

// Create clients lazily to ensure environment variables are loaded
let _supabaseAdmin: SupabaseClient<Database> | null = null;
let _supabaseClient: SupabaseClient<Database> | null = null;

// Lazy getters for clients
export const getSupabaseAdmin = () => {
  if (!_supabaseAdmin) {
    console.log('[DATABASE] Creating Supabase admin client');
    const SUPABASE_URL = getEnvVar('SUPABASE_URL', 'http://localhost:54321');
    const SUPABASE_SERVICE_ROLE_KEY = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
    _supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  }
  return _supabaseAdmin;
};

export const getSupabaseClient = () => {
  if (!_supabaseClient) {
    console.log('[DATABASE] Creating Supabase public client');
    const SUPABASE_URL = getEnvVar('SUPABASE_URL', 'http://localhost:54321');
    const SUPABASE_ANON_KEY = getEnvVar('SUPABASE_ANON_KEY');
    _supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _supabaseClient;
};

// For backward compatibility
export const supabaseAdmin = getSupabaseAdmin();
export const supabaseClient = getSupabaseClient();

// Export a function to execute raw SQL queries
export const executeRawQuery = async (query: string, params: any[] = []) => {
  const { data, error } = await supabaseAdmin.rpc('execute_sql', { sql_query: query, params });
  
  if (error) {
    throw new Error(`Failed to execute query: ${error.message}`);
  }
  
  return data;
}; 