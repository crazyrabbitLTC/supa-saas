/**
 * @file Database Client
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Provides database client instances for Drizzle ORM.
 * 
 * IMPORTANT:
 * - Use the appropriate client for your use case
 * - The Postgres client is for direct database access
 * - The Supabase client is for using Supabase features
 * 
 * Functionality:
 * - Creates and exports database clients
 * - Configures connection pooling
 * - Provides typed query interfaces
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as schema from './schema';
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
let _db: ReturnType<typeof drizzle> | null = null;
let _supabaseAdmin: SupabaseClient<Database> | null = null;
let _supabaseClient: SupabaseClient<Database> | null = null;
let _queryClient: ReturnType<typeof postgres> | null = null;

// Lazy getters for clients
export const getQueryClient = () => {
  if (!_queryClient) {
    console.log('[DATABASE] Creating Postgres client');
    const DATABASE_URL = getEnvVar('SUPABASE_DB_URL', 'postgresql://postgres:postgres@localhost:54322/postgres');
    _queryClient = postgres(DATABASE_URL, { max: 10 });
  }
  return _queryClient;
};

export const getDb = () => {
  if (!_db) {
    console.log('[DATABASE] Creating Drizzle ORM instance');
    _db = drizzle(getQueryClient(), { schema });
  }
  return _db;
};

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
export const db = getDb();
export const supabaseAdmin = getSupabaseAdmin();
export const supabaseClient = getSupabaseClient();
export const queryClient = getQueryClient();

// Export a function to execute raw SQL queries
export const executeRawQuery = async (query: string, params: any[] = []) => {
  return getQueryClient().unsafe(query, params);
}; 