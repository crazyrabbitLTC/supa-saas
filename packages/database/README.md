# Database Package

This package provides database access and type definitions for Supabase.

## Features

- Type-safe database access with Supabase client
- TypeScript type definitions for all database tables
- Conversion utilities for snake_case to camelCase
- Service layer for database operations

## Usage

### Importing the package

```typescript
import { supabaseClient, teamService, profileService } from 'database';
```

### Using services

```typescript
// Using team service
const team = await teamService.getTeamById('team-id');

// Using profile service
const profile = await profileService.getProfileById('user-id');
```

### Direct database access

```typescript
// Using Supabase client directly
const { data, error } = await supabaseClient
  .from('profiles')
  .select('*');
```

## Types

The database types are defined in the `src/types` directory. Each entity has its own file with type definitions.

## Services

The database services are defined in the `src/services` directory. Each entity has its own service file with CRUD operations.

## Configuration

The database configuration is loaded from environment variables. See the `.env.example` file for required variables. 