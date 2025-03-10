# SaaS-Supabase Monorepo Boilerplate

A comprehensive monorepo boilerplate for SaaS applications built with Supabase, TypeScript, and Turborepo.

## Features

- **Monorepo Structure**: Organized with Turborepo and pnpm for efficient workspace management
- **Supabase Integration**: Full integration with Supabase for auth, database, storage, and realtime features
- **TypeScript**: End-to-end type safety across all packages and applications
- **Modular Architecture**: Clear separation between frontend, API, and background services
- **Database Management**: Type-safe database access with Supabase client and migrations
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
│   ├── database/                 # Database types and services
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

This project uses Vitest for testing across all packages. Tests are organized by type:

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test interactions between components
- **API Tests**: Test API endpoints against a real Supabase instance

#### Running Tests

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
# Run team-related tests
pnpm test:teams

# Run API integration tests
pnpm test:api:integration
```

#### Testing Approach

Our testing approach follows these principles:

1. **Test Isolation**: Each test runs in isolation with its own setup and teardown
2. **Real Dependencies**: API tests use a real Supabase instance for accurate testing
3. **Immediate Verification**: Tests are run immediately after creation to catch issues early
4. **Comprehensive Coverage**: All API endpoints have corresponding tests

#### Test Structure

- `apps/api/src/__tests__/integration/`: API integration tests
- `apps/api/src/__tests__/setup/`: Test setup utilities
- `packages/database/src/__tests__/`: Database tests

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
- **Fastify**: For high-performance API
- **Next.js**: For frontend (placeholder)
- **Vitest**: For testing
- **Zod**: For runtime type validation

## License

MIT 