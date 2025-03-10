# Supabase

This directory contains Supabase configuration, migrations, and seed data.

## Structure

- `migrations/`: SQL migrations for the Supabase database
- `seed.sql`: Seed data for development and testing
- `config.toml`: Supabase configuration

## Working with Supabase

### Local Development

1. Start Supabase locally:
   ```bash
   pnpm supabase:start
   ```

2. Stop Supabase:
   ```bash
   pnpm supabase:stop
   ```

3. Check Supabase status:
   ```bash
   pnpm supabase:status
   ```

### Migrations

1. Create a new migration:
   ```bash
   supabase migration new <migration_name>
   ```

2. Apply migrations:
   ```bash
   supabase db reset
   ```

### Seed Data

Seed data is automatically applied when running `supabase db reset`.

## Conventions

- Migrations should be atomic and focused on a single change
- Use descriptive names for migrations
- Document complex migrations with comments
- Keep seed data minimal and focused on development needs
- Use the Supabase CLI for all database operations 