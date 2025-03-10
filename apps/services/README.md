# Background Services

This package contains background services and scheduled jobs for the SaaS application.

## Features

- Scheduled jobs using node-cron
- Database access with Drizzle ORM
- Supabase integration
- Structured logging
- Error handling and recovery

## Project Structure

```
services/
├── src/
│   ├── jobs/          # Background jobs
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript type definitions
│   ├── __tests__/     # Tests
│   └── index.ts       # Entry point
├── tsconfig.json      # TypeScript configuration
├── tsup.config.ts     # Build configuration
└── jest.config.js     # Test configuration
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
# Start the services
pnpm start
```

## Jobs

### Cleanup Job

The cleanup job runs daily at 2:00 AM to clean up old data from the database.

### Metrics Job

The metrics job runs hourly to collect and report metrics about the application.

## Adding New Jobs

1. Create a new file in the `jobs` directory
2. Implement the job logic
3. Register the job in `jobs/index.ts`

## Environment Variables

The background services use the following environment variables:

- `SERVICES_CRON_ENABLED`: Whether to enable cron jobs
- `SUPABASE_URL`: The Supabase URL
- `SUPABASE_ANON_KEY`: The Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: The Supabase service role key
- `SUPABASE_DB_URL`: The Supabase database URL 