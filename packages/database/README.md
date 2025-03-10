# Database Package

This package provides database access and type definitions for Supabase.

## Features

- Type-safe database access with Supabase client
- TypeScript type definitions for all database tables
- Conversion utilities for snake_case to camelCase
- Service layer for database operations

## Architecture

This package follows a service-oriented architecture:

- **Types**: Define the shape of data in both database and application formats
- **Services**: Provide business logic and data access methods
- **Client**: Manages connections to Supabase

### Type System

The type system handles the conversion between database (snake_case) and application (camelCase) formats:

- `*Row` types: Represent database tables with snake_case fields
- Regular types: Represent application data with camelCase properties
- Conversion utilities: Transform between the two formats

### Service Layer

Each entity has its own service that provides:

- CRUD operations
- Business logic
- Error handling
- Type conversion

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

## Vector Search (Coming Soon)

This package will soon support vector search capabilities using Supabase's pgvector integration:

```typescript
// Store embeddings
await vectorService.storeEmbedding({
  content: 'Document text',
  embedding: [0.1, 0.2, ...], // Vector from embedding model
  metadata: { source: 'document.pdf' }
});

// Search for similar content
const results = await vectorService.searchSimilar({
  embedding: [0.1, 0.2, ...],
  limit: 5,
  threshold: 0.8
});
```

## Types

The database types are defined in the `src/types` directory. Each entity has its own file with type definitions.

## Services

The database services are defined in the `src/services` directory. Each entity has its own service file with CRUD operations.

## Configuration

The database configuration is loaded from environment variables. See the `.env.example` file for required variables. 