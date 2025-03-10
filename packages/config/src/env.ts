/**
 * @file Environment Loading
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Loads and validates environment variables.
 * 
 * IMPORTANT:
 * - Environment variables are loaded from .env files
 * - Variables are validated against the schema
 * - Missing or invalid variables will throw errors
 * 
 * Functionality:
 * - Loads environment variables
 * - Validates against schema
 * - Provides typed access to environment variables
 */

import * as dotenv from 'dotenv';
import { z } from 'zod';
import {
  supabaseEnvSchema,
  apiEnvSchema,
  webEnvSchema,
  servicesEnvSchema,
  envSchema,
  type SupabaseEnv,
  type ApiEnv,
  type WebEnv,
  type ServicesEnv,
  type Env,
} from './schema';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

/**
 * Validates environment variables against a schema
 * @param schema The Zod schema to validate against
 * @returns The validated environment variables
 * @throws Error if validation fails
 */
function validateEnv<T extends z.ZodTypeAny>(
  schema: T
): z.infer<T> {
  try {
    return schema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('\n');
      
      throw new Error(`❌ Invalid environment variables:\n${missingVars}`);
    }
    
    throw error;
  }
}

// Validate and export environment variables
export const env: Env = validateEnv(envSchema);
export const supabaseEnv: SupabaseEnv = validateEnv(supabaseEnvSchema);
export const apiEnv: ApiEnv = validateEnv(apiEnvSchema);
export const webEnv: WebEnv = validateEnv(webEnvSchema);
export const servicesEnv: ServicesEnv = validateEnv(servicesEnvSchema); 