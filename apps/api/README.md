# API Service

This is the main API service for the SaaS application. It provides a RESTful API for the frontend and other services.

## Features

- RESTful API with Fastify
- Type-safe routes with Zod validation
- Database access with Drizzle ORM
- Supabase integration
- Comprehensive error handling
- Health check endpoints
- Structured logging

## Project Structure

```
api/
├── src/
│   ├── controllers/     # Business logic
│   ├── middleware/      # Request/response middleware
│   ├── plugins/         # Fastify plugins
│   ├── routes/          # API routes
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── __tests__/       # Tests
│   ├── index.ts         # Entry point
│   └── server.ts        # Server configuration
├── tsconfig.json        # TypeScript configuration
├── tsup.config.ts       # Build configuration
└── jest.config.js       # Test configuration
```

## Getting Started

### Development

```bash
# Start the development server with hot reloading
pnpm dev
```

### Testing

```bash
# Run tests
pnpm test
```

### Building

```bash
# Build for production
pnpm build
```

### Running in Production

```bash
# Start the server
pnpm start
```

## API Documentation

### Health Check

- `GET /health`: Basic health check
- `GET /health/detailed`: Detailed health check with dependencies

### Profiles

- `GET /api/v1/profiles/:id`: Get a profile by ID
- `GET /api/v1/profiles/me`: Get the current user's profile
- `PATCH /api/v1/profiles/:id`: Update a profile

## Adding New Routes

1. Create a new file in the `routes` directory
2. Define your route handlers
3. Register the routes in `routes/index.ts`

## Environment Variables

The API service uses the following environment variables:

- `API_PORT`: The port to listen on
- `API_HOST`: The host to bind to
- `SUPABASE_URL`: The Supabase URL
- `SUPABASE_ANON_KEY`: The Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: The Supabase service role key
- `SUPABASE_DB_URL`: The Supabase database URL 