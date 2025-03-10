# Type System for Supabase Integration

This document describes the type system used in the integration with Supabase, providing a comprehensive guide to working with typed database access.

## Overview

Our type system provides end-to-end type safety when working with the Supabase database. It consists of:

1. **Generated Types**: Automatically generated TypeScript types that match your Supabase database schema
2. **Conversion Utilities**: Tools to convert between snake_case (database) and camelCase (TypeScript) formats
3. **Service Layer**: Typed service methods for database operations
4. **Typed Clients**: Supabase clients initialized with the correct type parameters

## Generated Types

Types are automatically generated from your Supabase database schema using the Supabase CLI:

```bash
pnpm supabase:gen:types:local    # Generate from local Supabase instance
pnpm supabase:gen:types:remote   # Generate from remote Supabase project
```

The generated types are stored in `packages/database/src/types/supabase.ts` and follow this structure:

```typescript
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { ... }    // Table row data
        Insert: { ... } // Data for inserts
        Update: { ... } // Data for updates
      },
      teams: {
        Row: { ... }
        Insert: { ... }
        Update: { ... }
      },
      // Other tables...
    }
    Views: { ... }
    Functions: { ... }
    Enums: { ... }
  }
}
```

## Helper Types

We provide several helper types to make working with the database easier:

```typescript
// Helpers for working with specific tables
type Tables = Database['public']['Tables'];
type TablesInsert = { [K in keyof Tables]: Tables[K]['Insert'] };
type TablesUpdate = { [K in keyof Tables]: Tables[K]['Update'] };
type TablesRow = { [K in keyof Tables]: Tables[K]['Row'] };

// Helper type to get row type for a specific table
type TableRow<T extends keyof Tables> = Tables[T]['Row'];
type TableInsert<T extends keyof Tables> = Tables[T]['Insert'];
type TableUpdate<T extends keyof Tables> = Tables[T]['Update'];
```

## Case Conversion

PostgreSQL tables use snake_case for column names, while TypeScript typically uses camelCase. To bridge this gap, we provide conversion utilities:

```typescript
// Types for converting between snake_case and camelCase
type SnakeToCamel<S extends string> = ...
type SnakeToCamelObject<T> = ...
type CamelToSnake<S extends string> = ...
type CamelToSnakeObject<T> = ...

// Functions for converting objects
function snakeToCamel<T extends Record<string, any>>(obj: T): SnakeToCamelObject<T> { ... }
function camelToSnake<T extends Record<string, any>>(obj: T): CamelToSnakeObject<T> { ... }
```

## Typed Supabase Clients

The Supabase clients are initialized with the Database type to provide type safety for all queries:

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

export const getSupabaseClient = () => {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
};
```

## Typed Service Methods

Service methods use the types to provide end-to-end type safety:

```typescript
class TeamService {
  async getTeamById(id: string): Promise<Team | null> {
    const { data, error } = await supabaseClient
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get team: ${error.message}`);
    }
    
    return snakeToCamel(data) as Team;
  }
  
  // Other methods...
}
```

## Best Practices

1. **Always regenerate types after schema changes**: Run `pnpm supabase:gen:types` after any database schema changes
2. **Use the service layer**: Don't access the database directly from API routes
3. **Respect the type system**: Use the provided types for all database operations
4. **Handle type conversions consistently**: Use `snakeToCamel` and `camelToSnake` as needed
5. **Define interfaces for method parameters**: Create interfaces for complex method parameters

## Troubleshooting

If you encounter type errors when working with Supabase:

1. **Regenerate types**: Your database schema might have changed
2. **Check for missing tables**: Make sure all tables are included in the generated types
3. **Verify column names**: Ensure column names in your code match the database schema
4. **Update type imports**: Ensure you're importing types from the correct location

## References

- [Supabase TypeScript Support](https://supabase.com/docs/reference/javascript/typescript-support)
- [Supabase CLI Type Generation](https://supabase.com/docs/reference/cli/supabase-gen-types)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) 