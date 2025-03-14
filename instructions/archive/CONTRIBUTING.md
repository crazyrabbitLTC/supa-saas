# Contributing to Supa-SaaS

Thank you for your interest in contributing to Supa-SaaS! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please be respectful and considerate of others when contributing to this project. We aim to foster an inclusive and welcoming community.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/supa-saas.git`
3. Install dependencies: `npm install`
4. Set up your local environment (see below)
5. Create a new branch for your feature: `git checkout -b feature/your-feature-name`

## Environment Setup

1. Copy the `.env.example` file to `.env.local` in each package that requires environment variables:
   ```
   cp apps/api/.env.example apps/api/.env.local
   cp apps/web/.env.example apps/web/.env.local
   ```

2. Set up a Supabase project:
   - Create a new project at https://supabase.com
   - Get your project URL and API keys
   - Update the environment variables with your Supabase credentials

3. (Optional) Set up Stripe for payment processing:
   - Create a Stripe account at https://stripe.com
   - Get your API keys
   - Update the environment variables with your Stripe credentials

## Development Workflow

### Running the Application

Start the development servers:

```bash
# Start the API
npm run dev --filter=api

# Start the web application
npm run dev --filter=web
```

### Database Migrations

When making changes to the database schema, you should create a migration:

```bash
cd packages/database
npm run migration:create -- my-migration-name
```

This will create a new migration file in `packages/database/migrations/`.

### Testing

We use Vitest for the API and Jest for the web application.

```bash
# Run all tests
npm test

# Run API tests
npm test --filter=api

# Run web tests
npm test --filter=web

# Run specific test file
npm test -- apps/api/src/__tests__/integration/teams.test.ts
```

## Coding Standards

### General Guidelines

- Use TypeScript for all code
- Follow the existing code style
- Write comprehensive unit and integration tests for new features
- Update documentation when necessary
- Use descriptive variable and function names
- Keep functions small and focused

### API Development

- Place routes in the appropriate file in `apps/api/src/routes/`
- Implement business logic in controller methods in `apps/api/src/controllers/`
- Use services for shared functionality in `apps/api/src/services/`
- Define validation schemas in `apps/api/src/schemas/`
- Follow the RESTful API design principles
- Return consistent response structures
- Validate all inputs using Zod schemas
- Write tests for all new endpoints
- Document new endpoints in the appropriate files

### Web Development

- Use functional components with React hooks
- Place components in the appropriate directory in `apps/web/components/`
- Use Tailwind CSS for styling
- Follow the container/component pattern for separation of concerns
- Use React Query for data fetching
- Write tests for all new components
- Ensure accessibility standards are met

## Pull Request Process

1. Ensure all tests pass before submitting a pull request
2. Update documentation as necessary
3. Follow the pull request template
4. Request a review from maintainers
5. Address any feedback provided during the review process

## Reporting Bugs

When reporting a bug, please include:

1. A clear description of the issue
2. Steps to reproduce the problem
3. Expected behavior
4. Actual behavior
5. Any relevant logs or error messages
6. Your environment (OS, Node.js version, etc.)

## Feature Requests

We welcome feature requests! When submitting a feature request, please:

1. Clearly describe the feature
2. Explain the benefit of the feature
3. Provide examples of how it would be used
4. Indicate if you're willing to implement it yourself

## Code Review

All code should be reviewed before being merged. The review process includes:

1. Checking that the code follows our coding standards
2. Verifying that tests are comprehensive and pass
3. Ensuring documentation is updated
4. Checking for any security issues
5. Verifying that the feature or fix works as expected

## License

By contributing to Supa-SaaS, you agree that your contributions will be licensed under the project's MIT license.

## Questions?

If you have any questions about contributing, please open an issue or contact the project maintainers.

Thank you for contributing to Supa-SaaS! 