/**
 * @file Environment Schema
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Defines the schema for environment variables using Zod.
 * 
 * IMPORTANT:
 * - Add new environment variables here with proper validation
 * - Keep this in sync with .env.example
 * 
 * Functionality:
 * - Validates environment variables
 * - Provides type definitions for environment variables
 */

import { z } from 'zod';

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// Schema for Supabase environment variables
export const supabaseEnvSchema = z.object({
  SUPABASE_URL: z.string().default('http://localhost:54321'),
  SUPABASE_ANON_KEY: z.string().default('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'),
  SUPABASE_DB_URL: z.string().default('postgresql://postgres:postgres@localhost:54322/postgres'),
});

// Schema for API environment variables
export const apiEnvSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(4000),
  API_HOST: z.string().default('localhost'),
});

// Schema for Web environment variables
export const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().default('http://localhost:4000'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().default('http://localhost:54321'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'),
});

// Schema for Services environment variables
export const servicesEnvSchema = z.object({
  SERVICES_CRON_ENABLED: z.enum(['true', 'false']).default('true').transform((val) => val === 'true'),
});

// Combined schema for all environment variables
export const envSchema = z.object({
  ...supabaseEnvSchema.shape,
  ...apiEnvSchema.shape,
  ...webEnvSchema.shape,
  ...servicesEnvSchema.shape,
});

// Types for environment variables
export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
export type ServicesEnv = z.infer<typeof servicesEnvSchema>;
export type Env = z.infer<typeof envSchema>; 