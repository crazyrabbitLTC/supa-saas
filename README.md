# SaaS-Supabase Monorepo Boilerplate

A comprehensive monorepo boilerplate for SaaS applications built with Supabase, TypeScript, and Turborepo.

## Features

- **Monorepo Structure**: Organized with Turborepo and pnpm for efficient workspace management
- **Supabase Integration**: Full integration with Supabase for auth, database, storage, and realtime features
- **TypeScript**: End-to-end type safety across all packages and applications
- **Modular Architecture**: Clear separation between frontend, API, and background services
- **Database Management**: Drizzle ORM for type-safe database access with migration support
- **Local Development**: Seamless local development with Supabase CLI

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

### Installation

1. Clone the repository
2. Run the setup script:

```bash
./scripts/setup.sh
```

This will:
- Install dependencies
- Set up environment variables
- Initialize Supabase
- Generate Supabase types

### Development

Start all services in development mode:

```bash
./scripts/dev.sh
```

This will:
- Start Supabase if it's not running
- Start all services using Turborepo

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