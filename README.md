# SaaS-Supabase Monorepo Boilerplate

A comprehensive monorepo boilerplate for SaaS applications built with Supabase, TypeScript, and Turborepo.

## Features

- **Monorepo Structure**: Organized with Turborepo and pnpm for efficient workspace management
- **Supabase Integration**: Full integration with Supabase for auth, database, storage, and realtime features
- **TypeScript**: End-to-end type safety across all packages and applications
- **Modular Architecture**: Clear separation between frontend, API, and background services
- **Database Management**: Drizzle ORM for type-safe database access with migration support
- **Local Development**: Seamless local development with Supabase CLI
- **Testing**: Comprehensive testing setup with Vitest for all components

## Project Structure

```
saas-supabase-boilerplate/
├── apps/
│   ├── web/                      # Next.js frontend (placeholder)
│   ├── api/                      # High-volume API service
│   └── services/                 # Background services and jobs
├── packages/
│   ├── database/                 # Database schema and client
│   ├── config/                   # Shared configuration
│   └── tsconfig/                 # Shared TypeScript configs
├── scripts/                      # Utility scripts
└── supabase/                     # Supabase configuration and migrations
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase CLI
- Docker (for local Supabase)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up environment variables:
   ```bash
   pnpm env:setup
   ```
4. Initialize Supabase:
   ```bash
   pnpm supabase:init
   ```
5. Run migrations:
   ```bash
   pnpm supabase:migration:up
   ```

### Development

Start all services in development mode:

```bash
pnpm dev
```

Or start individual services:

```bash
# API
pnpm --filter api dev

# Web
pnpm --filter web dev

# Background services
pnpm --filter services dev
```

### Testing

Run all tests:

```bash
pnpm test
```

Run tests in watch mode:

```bash
pnpm test:watch
```

Run tests with UI:

```bash
pnpm test:ui
```

Run tests with coverage:

```bash
pnpm test:coverage
```

Run specific feature tests:

```bash
pnpm test:teams
```

### Building

Build all packages and applications:

```bash
pnpm build
```

## Key Technologies

- **TypeScript**: For type safety across the codebase
- **Turborepo**: For monorepo management
- **pnpm**: For efficient package management
- **Supabase**: For auth, database, storage, and realtime features
- **Drizzle ORM**: For type-safe database access
- **Fastify**: For high-performance API
- **Next.js**: For frontend (placeholder)
- **Vitest**: For testing
- **Zod**: For runtime type validation

## License

MIT 