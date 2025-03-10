# Web Frontend

This is a placeholder Next.js application for the SaaS frontend. It provides a simple UI to demonstrate the monorepo structure.

## Features

- Next.js 14 with App Router
- Tailwind CSS for styling
- Supabase Auth Helpers for authentication
- TypeScript for type safety

## Project Structure

```
web/
├── src/
│   ├── app/           # Next.js App Router
│   ├── components/    # React components
│   └── lib/           # Utility functions and hooks
├── public/            # Static assets
├── next.config.js     # Next.js configuration
├── tailwind.config.js # Tailwind CSS configuration
└── postcss.config.js  # PostCSS configuration
```

## Getting Started

### Development

```bash
# Start the development server
pnpm dev
```

### Building

```bash
# Build for production
pnpm build
```

### Running in Production

```bash
# Start the production server
pnpm start
```

## Environment Variables

The web application uses the following environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: The Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: The Supabase anonymous key
- `NEXT_PUBLIC_API_URL`: The URL of the API service

## Customizing

This is a minimal placeholder. You should replace it with your own implementation, including:

- Authentication flows
- User dashboard
- Account management
- Billing integration
- Feature-specific pages 