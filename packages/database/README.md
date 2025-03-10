# Database Package

This package provides database access and schema definitions using Drizzle ORM with Supabase.

## Features

- Type-safe database access with Drizzle ORM
- Schema definitions for all database tables
- Migration utilities
- Integration with Supabase

## Usage

### Importing the package

```typescript
import { db, supabaseClient, profiles } from 'database';
```

### Querying data

```typescript
// Using Drizzle ORM
const allProfiles = await db.select().from(profiles);

// Using Supabase client
const { data, error } = await supabaseClient
  .from('profiles')
  .select('*');
```

### Running migrations

```bash
# Generate migrations
pnpm generate

# Apply migrations
pnpm migrate
```

## Schema

The database schema is defined in the `src/schema` directory. Each table has its own file with the schema definition.

## Migrations

Migrations are managed using Drizzle Kit and are stored in the `drizzle` directory. They are automatically generated based on schema changes.

## Configuration

The database configuration is defined in `drizzle.config.ts`. This includes connection details and migration settings. 