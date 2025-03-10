/**
 * @file Type Exports
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Exports all types for the database package.
 * 
 * IMPORTANT:
 * - Import types from this file rather than individual files
 * - This ensures consistent type usage across the codebase
 * 
 * Functionality:
 * - Centralizes type exports
 * - Provides a single import point for all types
 */

// Re-export all types
export * from './helpers';
export * from './teams';
export * from './profiles';

// Import Supabase generated types - this will error until generated
import type { Database as SupabaseDatabase } from './supabase';

// For temporary development, create a more flexible Database type
// @ts-ignore - This is a temporary fix until the Supabase type generation is fixed
export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
        Relationships: any[];
      };
    };
    Views: Record<string, any>;
    Functions: Record<string, any>;
    Enums: Record<string, any>;
    CompositeTypes: Record<string, any>;
  };
};

// Export Supabase types
export { SupabaseDatabase };

// Export type helpers for Supabase tables
export type Tables = SupabaseDatabase['public']['Tables'];
export type TablesInsert = { [K in keyof Tables]: Tables[K]['Insert'] };
export type TablesUpdate = { [K in keyof Tables]: Tables[K]['Update'] };
export type TablesRow = { [K in keyof Tables]: Tables[K]['Row'] };

// Helper type to get row type for a specific table
export type TableRow<T extends keyof Tables> = Tables[T]['Row'];
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert'];
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update']; 