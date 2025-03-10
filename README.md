# SaaS-Supabase Monorepo Boilerplate

A comprehensive monorepo boilerplate for SaaS applications built with Supabase, TypeScript, and Turborepo.

## Features

- **Monorepo Structure**: Organized with Turborepo and pnpm for efficient workspace management
- **Supabase Integration**: Full integration with Supabase for auth, database, storage, and realtime features
- **TypeScript**: End-to-end type safety across all packages and applications
- **Modular Architecture**: Clear separation between frontend, API, and background services
- **Database Management**: Drizzle ORM for type-safe database access with migration support
- **Local Development**: Seamless local development with Supabase CLI
- **Testing**: Comprehensive testing setup for all components

## Project Structure

```
saas-supabase-boilerplate/
├── apps/
│   ├── web/                      # Next.js frontend (placeholder)
│   ├── api/                      # High-volume API service
│   └── services/                 # Background jobs/services
├── packages/
│   ├── database/                 # Database schema, migrations, seeds
│   ├── config/                   # Shared configuration
│   └── tsconfig/                 # Shared TypeScript configs
├── supabase/                     # Supabase configuration
│   ├── migrations/               # SQL migrations
│   ├── seed.sql                  # Seed data
│   └── config.toml               # Supabase configuration
├── scripts/                      # Utility scripts
├── turbo.json                    # Turborepo configuration
├── package.json                  # Root package.json
└── pnpm-workspace.yaml           # Workspace definition
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (for local Supabase)
- Supabase CLI

### Step 1: Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

### Step 2: Environment Setup

1. Set up environment variables:

```bash
# Copy the example environment file
pnpm env:setup
# or manually
cp .env.example .env.local
```

2. Initialize Supabase:

```bash
pnpm supabase:init
```

3. Get your Supabase keys:

```bash
supabase status
```

This will display your Supabase URL, anon key, and service role key. Make sure these values match what's in your `.env.local` file:

```
# Required Supabase keys in .env.local
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

4. Generate Supabase types:

```bash
pnpm supabase:gen:types
```

### Step 3: Development

The project includes several scripts to make development easier:

#### Interactive Development Script

Start the interactive development script:

```bash
./scripts/dev.sh
```

This will:
- Check if Supabase is running and start it if needed
- Verify environment variables are set correctly
- Let you choose which service to run (all, API, web, or background services)

#### Individual Service Scripts

Run specific services with proper environment variables:

```bash
# Run the API server
./scripts/run-api.sh

# Run the web frontend
./scripts/run-web.sh

# Run the background services
./scripts/run-services.sh
```

#### Using Turborepo

You can also use Turborepo to run services:

```bash
# Run all services
pnpm dev

# Run specific services
pnpm dev --filter=web
pnpm dev --filter=api
pnpm dev --filter=services
```

> **Important**: Always run pnpm workspace commands from the project root directory.

### Environment Variables

Environment variables are critical for the proper functioning of the application. The boilerplate includes:

- `.env`: Base environment variables
- `.env.local`: Local overrides (not committed to git)
- `.env.development`: Development-specific variables
- `.env.production`: Production-specific variables

The run scripts ensure that environment variables are properly loaded before any services start.

#### Checking Environment Variables

To verify your environment variables are set correctly:

```bash
node scripts/check-env.js
```

To test database and Supabase connections:

```bash
node scripts/test-env.js
```

### Testing

Run all tests to verify the boilerplate is working correctly:

```bash
./scripts/test-all.sh
```

This will:
- Load environment variables
- Start Supabase if it's not running
- Build all packages
- Test database connection
- Test Supabase connection
- Test API server
- Test background services

Individual packages can also be tested:

```bash
# Test API service
cd apps/api
pnpm test

# Test background services
cd apps/services
pnpm test
```

### Building for Production

Build all services for production:

```bash
./scripts/build.sh
```

## Services

### API Service

The API service is built with Fastify and provides a RESTful API for the frontend and other services. It includes:

- Type-safe routes with Zod validation
- Database access with Drizzle ORM
- Supabase integration
- Comprehensive error handling
- Health check endpoints

### Background Services

The background services package contains scheduled jobs and background tasks. It includes:

- Scheduled jobs using node-cron
- Database access with Drizzle ORM
- Supabase integration
- Error handling and recovery

### Web Frontend

The web frontend is a placeholder Next.js application. It includes:

- Next.js 14 with App Router
- Tailwind CSS for styling
- Supabase Auth Helpers for authentication
- TypeScript for type safety

## Troubleshooting

### Environment Variable Issues

If you encounter errors related to missing environment variables (e.g., "supabaseKey is required"):

1. **Use the provided run scripts**: Always use `./scripts/run-api.sh`, `./scripts/run-web.sh`, or `./scripts/run-services.sh` to start services
2. **Check your environment files**: Ensure `.env.local` contains all required variables
3. **Verify Supabase is running**: Run `supabase status` to check if Supabase is running and get the correct keys
4. **Test your environment**: Run `node scripts/check-env.js` to diagnose environment issues

### Path Resolution Issues

Always run pnpm workspace commands from the project root directory. Commands like `pnpm dev --filter=web` will fail if run from nested directories.

### Supabase Connection Issues

If you have issues connecting to Supabase:

1. Make sure Supabase is running: `supabase status`
2. Verify your keys match what's shown in the status output
3. Try restarting Supabase: `supabase stop` followed by `supabase start`
4. Test the connection: `node scripts/test-env.js`

## Documentation

Each folder in the project contains a README file that explains:
- The purpose of the folder
- Technologies used
- Guidance for adding new components
- Conventions to follow

Additional documentation:
- [Environment Configuration](docs/ENVIRONMENT.md)

## License

MIT 