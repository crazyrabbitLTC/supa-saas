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

// Schema for Supabase environment variables
export const supabaseEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_DB_URL: z.string().min(1),
});

// Schema for API environment variables
export const apiEnvSchema = z.object({
  API_PORT: z.coerce.number().int().positive(),
  API_HOST: z.string().min(1),
});

// Schema for Web environment variables
export const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

// Schema for Services environment variables
export const servicesEnvSchema = z.object({
  SERVICES_CRON_ENABLED: z.enum(['true', 'false']).transform((val) => val === 'true'),
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