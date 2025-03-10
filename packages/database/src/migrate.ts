/**
 * @file Database Migration Script
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Script to run Drizzle migrations programmatically.
 * 
 * IMPORTANT:
 * - This script should be run with caution in production
 * - Always backup the database before running migrations
 * 
 * Functionality:
 * - Connects to the database
 * - Applies pending migrations
 * - Reports migration status
 */

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

// Database connection string
const DATABASE_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';

// Migration function
async function runMigrations() {
  console.log('Running migrations...');
  
  // For migrations, we need a new connection
  const migrationClient = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);
  
  try {
    // Run migrations
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await migrationClient.end();
  }
}

// Run migrations
runMigrations(); 