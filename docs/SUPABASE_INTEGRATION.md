# Supabase Integration

This document provides an overview of how Supabase is integrated into this boilerplate project.

## Overview

Supabase is an open-source Firebase alternative that provides a suite of tools for building applications:

- **PostgreSQL Database**: A powerful, open-source relational database
- **Authentication**: User management with multiple providers
- **Storage**: File storage with access control
- **Realtime**: WebSocket-based realtime subscriptions
- **Edge Functions**: Serverless functions for backend logic
- **Vector Embeddings**: AI-powered search with pgvector

## Architecture

This boilerplate uses Supabase as the primary backend service, with a clean separation of concerns:

1. **Database Layer**: Direct access to Supabase via the client
2. **Service Layer**: Business logic and data access methods
3. **API Layer**: RESTful API endpoints for client applications
4. **Client Layer**: Frontend applications consuming the API

## Database Access

The database package provides a service-oriented approach to database access:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Service   │────▶│   Supabase  │────▶│  PostgreSQL │
│    Layer    │     │    Client   │     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Type Safety

The database package ensures type safety through:

1. **TypeScript Types**: Generated from the database schema
2. **Conversion Utilities**: Transform between snake_case and camelCase
3. **Service Methods**: Strongly-typed parameters and return values

### Row Level Security (RLS)

Supabase uses PostgreSQL's Row Level Security to control access to data:

- **Authentication**: Users can only access their own data
- **Authorization**: Users can only perform allowed actions
- **Policies**: Define who can do what with which data

## Authentication

Authentication is handled by Supabase Auth:

- **JWT Tokens**: Secure, stateless authentication
- **Multiple Providers**: Email/password, social logins, etc.
- **Role-Based Access**: Different roles for different users

## Migrations

Database migrations are managed through Supabase migrations:

- **SQL Files**: Plain SQL files for schema changes
- **Version Control**: Migrations are versioned and tracked
- **Repeatable**: Migrations can be applied to any environment

## Local Development

For local development, this boilerplate uses:

- **Supabase CLI**: For running a local Supabase instance
- **Docker**: For containerizing the local instance
- **Environment Variables**: For configuration

## Testing

Testing with Supabase is done through:

- **Test Database**: A separate database for testing
- **Seed Data**: Pre-populated test data
- **Cleanup**: Automatic cleanup after tests

## Deployment

Deployment options include:

- **Supabase Cloud**: Hosted Supabase instance
- **Self-Hosted**: Run your own Supabase instance
- **CI/CD**: Automated deployment pipelines

## Vector Search (Coming Soon)

This boilerplate will soon support vector search capabilities using Supabase's pgvector integration:

- **Embeddings**: Store vector embeddings in the database
- **Similarity Search**: Find similar items based on vector distance
- **AI Integration**: Connect with embedding models like OpenAI

## Best Practices

When working with Supabase in this boilerplate:

1. **Use Services**: Don't access the database directly from API routes
2. **Respect Types**: Use the provided type system for type safety
3. **RLS First**: Design your security model with RLS in mind
4. **Keep Migrations Clean**: One change per migration
5. **Test Thoroughly**: Test all database operations

## Resources

- [Supabase Documentation](https://supabase.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) 