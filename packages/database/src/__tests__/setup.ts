/**
 * @file Database Test Setup
 * @version 0.1.0
 * 
 * Setup file for database tests that initializes connections and provides utility functions.
 */

import { db, supabaseAdmin, supabaseClient, executeRawQuery } from '../client';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';

// Set timeout for tests to account for database operations
jest.setTimeout(15000);

/**
 * Test Database Utilities
 */
export const testDb = {
  db,
  supabaseAdmin,
  supabaseClient,
  executeRawQuery,

  /**
   * Generate a unique identifier for test data to avoid conflicts
   */
  uniqueId: () => uuidv4(),

  /**
   * Generate a unique name for test data
   */
  uniqueName: (prefix: string = 'test') => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,

  /**
   * Clean up test data after tests
   */
  async cleanup(testIds: {
    teamIds?: string[];
    userIds?: string[];
    invitationIds?: string[];
  }): Promise<void> {
    const { teamIds = [], userIds = [], invitationIds = [] } = testIds;

    // Delete in order to respect foreign key constraints
    if (invitationIds.length > 0) {
      await executeRawQuery(
        `DELETE FROM public.team_invitations WHERE id = ANY($1)`,
        [invitationIds]
      );
    }

    if (teamIds.length > 0) {
      // First delete team members to avoid FK constraints
      await executeRawQuery(
        `DELETE FROM public.team_members WHERE team_id = ANY($1)`,
        [teamIds]
      );
      // Then delete teams
      await executeRawQuery(
        `DELETE FROM public.teams WHERE id = ANY($1) AND is_personal = false`,
        [teamIds]
      );
    }

    if (userIds.length > 0) {
      // Only for test users - be very careful here
      // In real tests, you might want to use Supabase Auth API to create/delete users
      await executeRawQuery(
        `DELETE FROM public.profiles WHERE id = ANY($1)`,
        [userIds]
      );
    }
  },

  /**
   * Create a test user
   */
  async createTestUser(overrides: Partial<{
    id: string;
    email: string;
    fullName: string;
  }> = {}): Promise<{
    id: string;
    email: string;
    fullName: string;
  }> {
    const id = overrides.id || uuidv4();
    const email = overrides.email || `test-${id}@example.com`;
    const fullName = overrides.fullName || `Test User ${id.substring(0, 6)}`;

    // Create user in auth.users - this is simplified for testing
    // In real scenarios, use Supabase Auth API
    await executeRawQuery(
      `INSERT INTO auth.users (id, email, email_confirmed_at) 
       VALUES ($1, $2, now()) 
       ON CONFLICT (id) DO NOTHING`,
      [id, email]
    );

    // Create profile if needed
    await executeRawQuery(
      `INSERT INTO public.profiles (id, full_name) 
       VALUES ($1, $2) 
       ON CONFLICT (id) DO UPDATE SET full_name = $2`,
      [id, fullName]
    );

    return { id, email, fullName };
  },

  /**
   * Run a function within a transaction for testing
   * This allows tests to be isolated and rolled back if needed
   */
  async withTransaction<T>(fn: () => Promise<T>): Promise<T> {
    try {
      await executeRawQuery('BEGIN');
      const result = await fn();
      await executeRawQuery('ROLLBACK');
      return result;
    } catch (error) {
      await executeRawQuery('ROLLBACK');
      throw error;
    }
  },

  /**
   * Get a test JWT token for a user
   * This creates a valid JWT token for testing authentication
   */
  async getTestJwt(userId: string): Promise<string> {
    // This is a simplified approach - in real implementation, 
    // use Supabase Admin to create a custom JWT
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: `test-${userId}@example.com`,
      options: {
        redirectTo: 'http://localhost:3000',
      }
    });

    if (error) {
      throw new Error(`Failed to generate test JWT: ${error.message}`);
    }

    // Extract token from response
    return data.properties.token;
  }
};

/**
 * Setup function to be called before running tests
 */
export async function setupTestDb(): Promise<void> {
  // Check connection
  try {
    await executeRawQuery('SELECT 1');
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

/**
 * Teardown function to be called after running tests
 */
export async function teardownTestDb(): Promise<void> {
  // Any global cleanup needed
}

// Export utility to create test data objects
export const createTestData = {
  /**
   * Create a test team with basic data
   */
  team: (overrides: Partial<{
    name: string;
    slug: string;
    ownerId: string;
    isPersonal: boolean;
    subscriptionTier: string;
  }> = {}) => {
    return {
      id: uuidv4(),
      name: overrides.name || `Test Team ${Date.now()}`,
      slug: overrides.slug || `test-team-${Date.now()}`,
      description: 'Test team for automated testing',
      ownerId: overrides.ownerId || uuidv4(),
      isPersonal: overrides.isPersonal !== undefined ? overrides.isPersonal : false,
      subscriptionTier: overrides.subscriptionTier || 'free',
      subscriptionId: null,
      logoUrl: null,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}; 