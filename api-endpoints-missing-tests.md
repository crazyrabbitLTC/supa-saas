# API Endpoints Missing Tests

This document lists all API endpoints that currently don't have integration tests.

## Profile Endpoints

All profile endpoints are missing tests:

1. `GET /api/v1/profiles/:id` - Get profile by ID
2. `GET /api/v1/profiles/me` - Get current user's profile
3. `PATCH /api/v1/profiles/:id` - Update profile

## Team Endpoints

The following team endpoints need additional tests:

1. `GET /api/v1/teams/subscription-tiers` - Get all available subscription tiers

## Health Endpoints

The health endpoints have mock tests but need tests against the actual implementation:

1. `GET /api/v1/health` - Basic health check
2. `GET /api/v1/health/detailed` - Detailed health check with dependencies

## Next Steps

To complete the test coverage:

1. Create a `profiles.test.ts` file in the `apps/api/src/__tests__/integration/` directory
2. Add tests for the subscription tiers endpoint in the existing teams tests
3. Update the health tests to test against the actual implementation instead of mocks

## Implementation Plan

1. **Profile Tests**:
   - Test retrieving profiles by ID
   - Test authentication for the current user's profile
   - Test profile updates with validation

2. **Subscription Tiers Test**:
   - Test retrieving all subscription tiers
   - Verify the structure of the response

3. **Health Endpoint Tests**:
   - Test the basic health endpoint against the actual implementation
   - Test the detailed health endpoint against the actual implementation
   - Verify proper error handling when services are down 