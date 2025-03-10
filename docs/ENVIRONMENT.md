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

### Critical Environment Variables

The following environment variables are critical for the application to function properly:

#### Supabase Configuration
```
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

#### API Configuration
```
API_PORT=4000
API_HOST=localhost
```

#### Web Configuration
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Services Configuration
```
SERVICES_CRON_ENABLED=true
```

## Run Scripts

The project includes several scripts that ensure environment variables are properly loaded:

### Interactive Development Script

```bash
./scripts/dev.sh
```

This script:
- Loads environment variables from `.env.local` and `.env`
- Checks if Supabase is running and starts it if needed
- Verifies that critical environment variables are set
- Lets you choose which service to run

### Individual Service Scripts

```bash
# Run the API server
./scripts/run-api.sh

# Run the web frontend
./scripts/run-web.sh

# Run the background services
./scripts/run-services.sh
```

These scripts:
- Load environment variables from `.env.local` and `.env`
- Check that critical environment variables are set
- Pass the environment variables to the service process

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

## Diagnostic Tools

The project includes diagnostic tools to help troubleshoot environment variable issues:

### Check Environment Variables

```bash
node scripts/check-env.js
```

This script:
- Loads environment variables from `.env.local` and `.env`
- Checks if critical environment variables are set
- Tests creating a Supabase client
- Tests connecting to Supabase

### Test Database Connection

```bash
node scripts/test-env.js
```

This script:
- Tests the Supabase client connection
- Tests the Postgres database connection
- Reports any connection issues

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

## Troubleshooting

### Missing Environment Variables

If you encounter errors like "supabaseKey is required":

1. Make sure you're using the provided run scripts (`./scripts/run-api.sh`, etc.)
2. Check that your `.env.local` file contains all required variables
3. Verify that Supabase is running with `supabase status`
4. Compare the keys in your `.env.local` file with the ones shown by `supabase status`

### Environment Variables Not Loading

If environment variables aren't being loaded:

1. Make sure you're running commands from the project root directory
2. Check file permissions on your `.env.local` file
3. Try explicitly setting the variables in the command: `SUPABASE_URL=http://localhost:54321 pnpm dev`

### Supabase Connection Issues

If you can't connect to Supabase:

1. Make sure Supabase is running: `supabase status`
2. Try restarting Supabase: `supabase stop` followed by `supabase start`
3. Check that your keys match what's shown in the status output
4. Test the connection with `node scripts/test-env.js` 