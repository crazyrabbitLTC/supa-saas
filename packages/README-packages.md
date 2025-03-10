# Packages

This directory contains shared packages that are used across multiple apps in the monorepo.

## Structure

- `database/`: Database schema, migrations, and query utilities using Drizzle ORM
- `config/`: Shared configuration utilities and environment variable handling
- `tsconfig/`: Shared TypeScript configurations

## Adding a New Package

1. Create a new directory for your package
2. Initialize with a package.json
3. Add the package to the workspace in the root pnpm-workspace.yaml
4. Configure the package in turbo.json pipeline if needed

## Conventions

- Packages should be focused on a single responsibility
- Packages should be well-documented with clear usage examples
- Packages should have comprehensive tests
- Use TypeScript for type safety
- Export types for consumers to use
- Minimize dependencies between packages when possible 