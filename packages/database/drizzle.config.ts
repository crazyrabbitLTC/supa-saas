/**
 * @file Drizzle Configuration
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Configuration for Drizzle ORM.
 * 
 * IMPORTANT:
 * - This file configures how Drizzle interacts with the database
 * - Changes here affect migration generation and database operations
 * 
 * Functionality:
 * - Configures database connection
 * - Sets up migration paths
 * - Defines schema location
 */

import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

// Database connection string
const connectionString = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';

export default {
  schema: './src/schema/index.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString,
  },
  // Only include tables in the public schema
  includeSchema: ['public'],
  // Verbose output for debugging
  verbose: true,
  // Strict mode for type safety
  strict: true,
} satisfies Config; 