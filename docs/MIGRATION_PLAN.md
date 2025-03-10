# Migration Plan: Drizzle ORM to Supabase

This document outlines the plan for migrating from Drizzle ORM to Supabase in the codebase.

## Background

The project is currently using both Drizzle ORM and Supabase for database access, which can lead to inconsistencies and errors. Since this is meant to be a Supabase boilerplate project, we should standardize on Supabase for all database operations.

## Migration Steps

### 1. Update Database Types ✅

- [x] Generate types from Supabase schema
- [x] Create helper types for camelCase conversions

### 2. Create Service Layer ✅

- [x] Implement services using Supabase client
- [x] Handle camelCase to snake_case conversion

### 3. Update Tests ✅

- [x] Create tests for the Supabase service layer
- [x] Ensure tests use snake_case for database fields

### 4. Replace Drizzle with Supabase ✅

#### 4.1. Update Client ✅

- [x] Update `packages/database/src/client.ts` to remove Drizzle
- [x] Ensure all exports use Supabase clients

#### 4.2. Update Schema ✅

- [x] Remove Drizzle schema files
- [x] Ensure Supabase types are up-to-date

#### 4.3. Update Services ✅

- [x] Replace all Drizzle-based services with Supabase equivalents
- [x] Update service exports

#### 4.4. Update API Routes ✅

- [x] Update API routes to use Supabase services
- [x] Replace Drizzle-specific code with Supabase equivalents

#### 4.5. Update Tests ✅

- [x] Update all tests to use Supabase services
- [x] Remove Drizzle-specific test code

### 5. Remove Drizzle Dependencies ✅

- [x] Update package.json files to remove Drizzle dependencies
- [x] Remove Drizzle configuration files

## Files Updated

### Client Files ✅

- [x] `packages/database/src/client.ts`

### Schema Files ✅

- [x] `packages/database/src/schema/index.ts` (Deleted)
- [x] `packages/database/src/schema/profiles.ts` (Deleted)
- [x] `packages/database/src/schema/teams.ts` (Deleted)

### Service Files ✅

- [x] `packages/database/src/services/teamService.ts` (Replaced with Supabase version)
- [x] `packages/database/src/services/index.ts` (Updated)

### API Route Files ✅

- [x] `apps/api/src/routes/teams.ts` (Updated)
- [x] `apps/api/src/routes/profiles.ts` (Updated)

### Controller Files ✅

- [x] `apps/api/src/controllers/profile-controller.ts` (Updated)
- [x] `apps/api/src/controllers/teamController.ts` (Updated)

### Test Files ✅

- [x] `packages/database/src/__tests__/services/teamService.test.ts` (Replaced)
- [x] `apps/api/src/__tests__/routes/teams.test.ts` (Updated)
- [x] `apps/api/src/__tests__/integration/teams.test.ts` (Updated)

### Package Files ✅

- [x] `packages/database/package.json` (Updated)
- [x] `apps/api/package.json` (Updated)
- [x] `apps/services/package.json` (Updated)
- [x] `package.json` (Updated)

## Migration Strategy

1. ✅ Start with the core database package
2. ✅ Update services one by one
3. ✅ Update API routes to use the new services
4. ✅ Update tests to use the new services
5. ✅ Remove Drizzle dependencies

## Testing Strategy

1. ✅ Write tests for the new Supabase services
2. ✅ Ensure all tests pass with the new services
3. ✅ Run integration tests to verify end-to-end functionality

## Rollback Plan

If issues arise during migration:

1. Keep both implementations temporarily
2. Roll back to Drizzle for specific components if needed
3. Address issues and retry migration

## Timeline

- ✅ Phase 1: Update Database Types and Service Layer (Completed)
- ✅ Phase 2: Replace Drizzle with Supabase (Completed)
- ✅ Phase 3: Remove Drizzle Dependencies (Completed)
- ✅ Phase 4: Testing and Validation (Completed)

## Next Steps

- [ ] Implement vector search using Supabase's pgvector support
- [ ] Update documentation to highlight Supabase features
- [ ] Add more examples of Supabase-specific features (realtime, storage, etc.) 