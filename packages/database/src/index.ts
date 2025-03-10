/**
 * @file Database Package Entry Point
 * @version 0.2.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Main entry point for the database package.
 * 
 * IMPORTANT:
 * - Import from this file rather than individual files
 * - This ensures consistent usage across the codebase
 * 
 * Functionality:
 * - Exports Supabase clients
 * - Exports database types
 * - Exports database services
 */

// Export Supabase clients
export {
  supabaseClient,
  supabaseAdmin,
  executeRawQuery,
} from './client';

// Export types
export * from './types';

// Export services
export * from './services'; 