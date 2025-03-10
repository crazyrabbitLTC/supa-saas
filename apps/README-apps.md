# Apps

This directory contains all the application packages in the monorepo.

## Structure

- `web/`: Next.js frontend application (placeholder)
- `api/`: Express/Fastify API server for high-volume requests
- `services/`: Background services and jobs

## Adding a New App

1. Create a new directory for your app
2. Initialize with the appropriate package.json
3. Add the app to the workspace in the root pnpm-workspace.yaml
4. Configure the app in turbo.json pipeline

## Conventions

- Each app should have its own package.json and tsconfig.json
- Apps should import shared code from the packages/ directory
- Apps should follow a consistent structure for routes, controllers, etc.
- Use environment variables for configuration
- Document the purpose and usage of the app in a README.md file 