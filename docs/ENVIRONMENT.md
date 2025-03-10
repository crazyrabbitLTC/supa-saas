# Environment Configuration

This document explains how environment variables are managed in the project.

## Environment Files

The project uses multiple environment files for different environments:

- `.env`: Base environment variables for all environments
- `.env.local`: Local overrides (not committed to git)
- `.env.development`: Development environment variables
- `.env.production`: Production environment variables

## Priority Order

Environment variables are loaded in the following order, with later files taking precedence:

1. `.env`
2. `.env.{NODE_ENV}` (e.g., `.env.development` when NODE_ENV=development)
3. `.env.local`
4. Environment variables set in the shell

## Required Variables

The required environment variables are listed in `.env.example`. You should copy this file to `.env.local` and fill in the values:

```bash
pnpm env:setup
```

## Environment Scripts

The following scripts are available for working with environment variables:

- `pnpm env:check`: Check if all required environment variables are set
- `pnpm env:setup`: Copy `.env.example` to `.env.local`
- `pnpm env:dev`: Run a command with NODE_ENV=development
- `pnpm env:prod`: Run a command with NODE_ENV=production

Examples:

```bash
# Run the development server with development environment
pnpm env:dev pnpm dev

# Build for production
pnpm env:prod pnpm build
```

## Validation

Environment variables are validated using Zod schemas in the `config` package. If a required variable is missing or invalid, an error will be thrown with details about the missing or invalid variables.

## Adding New Variables

To add a new environment variable:

1. Add it to `.env.example` with a placeholder value
2. Add it to the appropriate schema in `packages/config/src/schema.ts`
3. Update the types if necessary
4. Add it to the relevant environment files (`.env`, `.env.development`, `.env.production`)

## Accessing Variables in Code

Use the `config` package to access environment variables in your code:

```typescript
import { env, supabaseEnv } from 'config';

// Access all environment variables
const allConfig = env;

// Access Supabase-specific variables
const supabaseUrl = supabaseEnv.SUPABASE_URL;
``` 