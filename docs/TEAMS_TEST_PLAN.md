# Teams Feature Test Plan

This document outlines the testing strategy for the Teams feature, focusing on API routes and database functionality. The plan provides a structured approach to ensure comprehensive testing coverage without relying on mocks.

## Testing Goals

1. Validate all Team-related database operations
2. Verify API routes handle requests correctly
3. Ensure Row Level Security (RLS) policies work as expected
4. Confirm database triggers execute properly
5. Test error handling and edge cases
6. Achieve at least 80% code coverage for team-related functionality

## Test Framework and Structure

### Framework

We will use the following tools for testing:

- **Jest**: Primary test runner and assertion library
- **Supertest**: For API endpoint testing
- **Drizzle ORM**: Direct database access for validation
- **Supabase JS Client**: For testing RLS policies from client perspective

### Directory Structure

```
apps/api/src/__tests__/
├── controllers/
│   └── teamController.test.ts
├── routes/
│   └── teams.test.ts
│   └── teamInvitations.test.ts
├── integration/
│   └── teamFlow.test.ts
│   └── invitationFlow.test.ts
│   └── subscriptionFlow.test.ts
├── fixtures/
│   └── teamData.ts
│   └── userData.ts
└── helpers/
    └── dbHelpers.ts
    └── authHelpers.ts
```

## Database Testing

### Team Service Tests

Test file: `packages/database/src/__tests__/services/teamService.test.ts`

#### Test Cases

1. **Team Creation**
   - Create a team with minimal information
   - Create a team with complete information
   - Verify personal team creation
   - Test slug generation and uniqueness
   - Verify owner is automatically added as a member

2. **Team Retrieval**
   - Get team by ID
   - Get team by slug
   - Get user's teams
   - Test non-existent team retrieval

3. **Team Updates**
   - Update team name
   - Update team description
   - Update team logo
   - Test metadata updates
   - Verify updated_at is updated

4. **Team Deletion**
   - Delete a regular team
   - Attempt to delete a personal team (should fail)
   - Verify cascade deletion of team members and invitations

5. **Team Membership**
   - Add a member to a team
   - Update a member's role
   - Remove a member from a team
   - Test member limit enforcement
   - Verify last owner cannot be removed

6. **Team Invitations**
   - Create an invitation
   - Accept an invitation
   - Delete an invitation
   - Test invitation expiration
   - Verify duplicate invitation handling

7. **Subscription Management**
   - Change subscription tier
   - Test feature limits based on subscription
   - Update subscription ID

## API Testing

### Team Routes Tests

Test file: `apps/api/src/__tests__/routes/teams.test.ts`

#### Test Cases

1. **Authentication**
   - Test routes with no authentication (should fail)
   - Test routes with invalid authentication (should fail)
   - Test routes with valid authentication

2. **Team CRUD Operations**
   - POST /teams - Create a new team
   - GET /teams - List user's teams
   - GET /teams/:id - Get team details
   - PUT /teams/:id - Update team
   - DELETE /teams/:id - Delete team
   - Test validation errors for each endpoint

3. **Team Membership Operations**
   - GET /teams/:id/members - List team members
   - POST /teams/:id/members - Add team member
   - PUT /teams/:id/members/:userId - Update member role
   - DELETE /teams/:id/members/:userId - Remove member
   - Test permissions (owner vs. admin vs. member)

4. **Invitation Operations**
   - POST /teams/:id/invitations - Create invitation
   - GET /teams/:id/invitations - List team invitations
   - DELETE /teams/:id/invitations/:id - Delete invitation
   - GET /invitations/:token - Verify invitation
   - POST /invitations/:token/accept - Accept invitation

5. **Subscription Operations**
   - GET /subscription-tiers - List available tiers
   - PUT /teams/:id/subscription - Update subscription

### RLS Policy Tests

Test file: `packages/database/src/__tests__/rls/teamRls.test.ts`

#### Test Cases

1. **Team Access**
   - Team owner can access team data
   - Team member can access team data
   - Non-team member cannot access team data
   - Anonymous user cannot access team data

2. **Team Modification**
   - Owner can modify team details
   - Admin can modify team details
   - Regular member cannot modify team details
   - Non-member cannot modify team details

3. **Member Management**
   - Owner can add/remove members and change roles
   - Admin can add members but not change owner role
   - Regular member cannot add/remove members
   - Test role hierarchy enforcement

4. **Invitation Management**
   - Owner can create/delete invitations
   - Admin can create/delete invitations
   - Regular member cannot create/delete invitations
   - Anyone with a valid token can view invitation details

## Integration Testing

### Team Flows

Test file: `apps/api/src/__tests__/integration/teamFlows.test.ts`

#### Test Cases

1. **Complete Team Lifecycle**
   - Create a team
   - Update team details
   - Add members with different roles
   - Remove members
   - Delete the team
   - Verify database state at each step

2. **Invitation Flow**
   - Create a team
   - Generate invitation
   - Accept invitation as new user
   - Verify membership
   - Test expired/invalid invitations

3. **Subscription Change Flow**
   - Create a team
   - Change subscription tier
   - Test feature limitations based on tier
   - Downgrade and verify enforcement of limits

## Test Data Strategy

To avoid using mocks, we'll use the following strategy for test data:

1. **Setup**: Create temporary data at the start of each test
2. **Validation**: Perform direct database queries to validate results
3. **Cleanup**: Remove all test data after each test
4. **Isolation**: Use unique identifiers for test data to prevent conflicts

## Test Database

For testing, we'll use:

1. A dedicated test schema in the Supabase database
2. Transaction wrapping for tests when possible (to enable rollback)
3. Cleanup functions to remove test data even if tests fail

## Implementation Guidelines

1. **No Mocks**: Test against actual database when possible
2. **Isolation**: Each test should be independent and not affect other tests
3. **Performance**: Use transaction wrapping and efficient setup/teardown
4. **Readability**: Use descriptive test names and organize by functionality
5. **Coverage**: Track code coverage and maintain minimum thresholds

## Test Case Template

```typescript
describe('Feature: [Feature Name]', () => {
  // Setup test data
  let testData;
  
  beforeAll(async () => {
    // Global setup if needed
  });
  
  beforeEach(async () => {
    // Setup test data for each test
    testData = await createTestData();
  });
  
  afterEach(async () => {
    // Clean up test data
    await cleanupTestData(testData);
  });
  
  afterAll(async () => {
    // Global cleanup if needed
  });
  
  describe('Function/Endpoint: [Name]', () => {
    test('should [expected behavior] when [condition]', async () => {
      // Arrange
      const input = { /* test input */ };
      
      // Act
      const result = await functionUnderTest(input);
      
      // Assert
      expect(result).toEqual(/* expected output */);
      
      // Verify database state if needed
      const dbState = await queryDatabase();
      expect(dbState).toEqual(/* expected state */);
    });
    
    // Additional test cases...
  });
});
```

## Continuous Integration

All tests will be integrated into the CI pipeline to ensure:

1. Tests run on every pull request
2. Code coverage reports are generated
3. Tests must pass before merging

## Implementation Plan

1. Set up test environment and database
2. Create test utilities and helpers
3. Implement database service tests
4. Implement API route tests
5. Implement RLS policy tests
6. Implement integration tests
7. Configure CI integration

## Priority Test Cases

Based on criticality, implement tests in this order:

1. Team creation and basic CRUD operations
2. Team membership management
3. Invitation system
4. RLS policies
5. Subscription management
6. Edge cases and error handling 