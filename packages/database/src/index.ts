/**
 * @file Database Package Entry Point
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Main entry point for the database package.
 * 
 * IMPORTANT:
 * - Import this package to access database functionality
 * - Use the appropriate client for your use case
 * 
 * Functionality:
 * - Exports database clients
 * - Exports schema definitions
 * - Exports type definitions
 */

// Export database clients
export * from './client';

// Export schema
export * from './schema';

// Export types
export * from './types/supabase'; 