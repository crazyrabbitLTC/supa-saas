# Supa-SaaS Project Structure

## Overview

Supa-SaaS is a comprehensive SaaS boilerplate built with Supabase, TypeScript, and Turborepo. It provides a solid foundation for building modern web applications with team management, authentication, and subscription capabilities.

## Repository Structure

The project is organized as a monorepo using Turborepo, with the following main packages:

```
supa-saas/
├── apps/
│   ├── api/           # Backend API service
│   ├── web/           # Frontend web application
│   └── docs/          # Documentation site
├── packages/
│   ├── database/      # Database schema, types, and services
│   ├── shared/        # Shared utilities and types
│   └── ui/            # UI component library
├── instructions/      # Project documentation and guides
└── tools/             # Development and deployment tools
```

## Key Components

### API (apps/api)

The API service is built using Fastify, a high-performance Node.js web framework. It provides RESTful endpoints for managing users, teams, and subscriptions.

**Key Features:**
- JWT-based authentication with Supabase Auth
- Team and user management
- Invitation system
- Subscription management
- Database integration with Supabase

**Technology Stack:**
- Fastify for the web server
- TypeScript for type safety
- Zod for schema validation
- Vitest for testing
- Supabase for database and authentication

### Web Application (apps/web)

The web frontend is built with React and Next.js, providing a modern and responsive user interface.

**Key Features:**
- User authentication
- Team management dashboard
- Profile management
- Invitation system
- Subscription management

**Technology Stack:**
- Next.js as the React framework
- TypeScript for type safety
- Tailwind CSS for styling
- React Query for data fetching
- Supabase client for authentication and data access

### Database Package (packages/database)

This package contains the database schema, types, and services used across the application.

**Key Features:**
- Type definitions for database entities
- Database service for interacting with Supabase
- Migration scripts and schema definitions

**Technology Stack:**
- TypeScript for type definitions
- Supabase for database services
- PostgreSQL for database storage

## Application Flow

### Authentication Flow

1. User registers or logs in through the web interface
2. Supabase Auth handles the authentication process
3. Upon successful authentication, a JWT token is issued
4. The token is stored in the browser and used for subsequent API requests
5. The API validates the token for each authenticated request

### Team Management Flow

1. User creates a team
2. User becomes the team owner
3. User can invite others to join the team
4. Invited users receive email notifications
5. Invited users can accept or decline invitations
6. Team owners and admins can manage team members and settings

### Subscription Management Flow

1. Team owners can view available subscription tiers
2. Team owners can select a subscription tier
3. If the tier is paid, they are redirected to a payment process
4. Upon successful payment, the team's subscription is updated
5. Team capabilities are adjusted based on the subscription tier

## Development Workflow

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start the development services:
   - API: `npm run dev --filter=api`
   - Web: `npm run dev --filter=web`
5. Access the application at http://localhost:3000

### Testing

Tests are written using Vitest for the API and Jest for the web application.

Run tests:
- All tests: `npm test`
- API tests: `npm test --filter=api`
- Web tests: `npm test --filter=web`

### Building for Production

Build all packages:
```
npm run build
```

### Deployment

The application can be deployed to various platforms:

- API: Can be deployed to any Node.js hosting service
- Web: Can be deployed to Vercel, Netlify, or any static hosting service
- Database: Uses Supabase, which is already hosted

## Extending the Application

### Adding New API Endpoints

1. Define routes in a new or existing route file in `apps/api/src/routes/`
2. Implement controller methods in `apps/api/src/controllers/`
3. Add services for business logic in `apps/api/src/services/`
4. Define validation schemas in `apps/api/src/schemas/`
5. Update tests in `apps/api/src/__tests__/`

### Adding New Frontend Features

1. Create new components in `apps/web/components/`
2. Add pages in `apps/web/pages/`
3. Implement API calls in `apps/web/services/`
4. Add state management in `apps/web/context/` or `apps/web/hooks/`
5. Update tests in `apps/web/tests/`

## Database Schema

See the [API_SPECIFICATION.md](./API_SPECIFICATION.md) file for details on the data models used in the application.

## Security Considerations

- Authentication is handled by Supabase Auth, a secure authentication service
- API endpoints are protected with JWT authentication
- Row Level Security (RLS) in Supabase ensures data access is restricted appropriately
- HTTPS is enforced for all communication
- Input validation using Zod schemas prevents malicious inputs
- Environment variables are used for sensitive configuration

## Performance Considerations

- Fastify is used for the API service due to its high performance
- Database queries are optimized with indexes and proper filtering
- The web application uses React Query for efficient data fetching and caching
- Turborepo enables efficient builds by sharing build artifacts across packages

## Next Steps and Roadmap

1. Implement more comprehensive logging and monitoring
2. Add analytics tracking for user activity
3. Enhance subscription management with usage tracking
4. Implement multi-factor authentication
5. Add more payment providers beyond the initial implementation
6. Develop mobile applications using the existing API 