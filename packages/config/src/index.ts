/**
 * @file Config Package Entry Point
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Main entry point for the configuration package.
 * 
 * IMPORTANT:
 * - Import this package to access environment variables
 * - All environment variables are validated using Zod
 * 
 * Functionality:
 * - Loads environment variables
 * - Validates environment variables
 * - Provides typed access to configuration
 */

export * from './env';
export * from './schema'; 