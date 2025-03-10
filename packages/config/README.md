# Config Package

This package provides configuration utilities and environment variable handling for the monorepo.

## Features

- Environment variable loading and validation using Zod
- Type-safe access to configuration
- Shared configuration across packages

## Usage

### Importing the package

```typescript
import { env, supabaseEnv, apiEnv } from 'config';
```

### Accessing environment variables

```typescript
// Access all environment variables
const allConfig = env;

// Access Supabase-specific variables
const supabaseUrl = supabaseEnv.SUPABASE_URL;

// Access API-specific variables
const apiPort = apiEnv.API_PORT;
```

### Adding new environment variables

1. Add the variable to `.env.example` in the root
2. Add the variable to the appropriate schema in `src/schema.ts`
3. Update the types if necessary

## Validation

All environment variables are validated at runtime using Zod schemas. If a required variable is missing or invalid, an error will be thrown with details about the missing or invalid variables. 