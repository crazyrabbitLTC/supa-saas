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
2. Install dependencies:

```bash
pnpm install
```

3. Start local Supabase:

```bash
pnpm supabase:start
```

4. Start development servers:

```bash
pnpm dev
```

## Documentation

Each folder in the project contains a README file that explains:
- The purpose of the folder
- Technologies used
- Guidance for adding new components
- Conventions to follow

## License

MIT 