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
import { createClient } from '@supabase/supabase-js';
import * as schema from './schema';
import { Database } from './types/supabase';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DATABASE_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';

// Create a Postgres client (for direct database access)
const queryClient = postgres(DATABASE_URL, { max: 10 });
export const db = drizzle(queryClient, { schema });

// Create a Supabase client (for using Supabase features)
export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export const supabaseClient = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Export a function to execute raw SQL queries
export const executeRawQuery = async (query: string, params: any[] = []) => {
  return queryClient.unsafe(query, params);
}; 