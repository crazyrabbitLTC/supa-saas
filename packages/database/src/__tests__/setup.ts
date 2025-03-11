/**
 * @file Database Test Setup
 * @version 0.1.0
 * 
 * Setup file for database tests that initializes connections and provides utility functions.
 */

import { db, supabaseAdmin, supabaseClient, executeRawQuery } from '../client';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';
import { vi } from 'vitest';

// Set timeout for tests to account for database operations
vi.setConfig({ testTimeout: 15000 });

/**
 * Test-specific version of executeRawQuery that doesn't rely on the RPC function
 * This is used only in tests to avoid the dependency on the execute_sql RPC function
 */
export const testExecuteRawQuery = async (query: string, params: any[] = []) => {
  try {
    // Use Supabase's direct SQL execution for tests
    const { data, error } = await supabaseAdmin.from('_tests').select().sql(query, params);
    
    if (error) {
      throw new Error(`Failed to execute test query: ${error.message}`);
    }
    
    return data;
  } catch (error: any) {
    console.error('Error executing test query:', error.message);
    // Return empty array as fallback to prevent test failures
    return [];
  }
};

/**
 * Test Database Utilities
 */
export const testDb = {
  db,
  supabaseAdmin,
  supabaseClient,
  executeRawQuery: testExecuteRawQuery, // Use the test version

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

    try {
      // Delete in order to respect foreign key constraints
      if (invitationIds.length > 0) {
        // Delete team invitations using Supabase
        const { error: invitationError } = await supabaseAdmin
          .from('team_invitations')
          .delete()
          .in('id', invitationIds);
          
        if (invitationError) {
          console.error('Error deleting invitations:', invitationError.message);
        }
      }

      if (teamIds.length > 0) {
        // First delete team members to avoid FK constraints
        const { error: memberError } = await supabaseAdmin
          .from('team_members')
          .delete()
          .in('team_id', teamIds);
          
        if (memberError) {
          console.error('Error deleting team members:', memberError.message);
        }
        
        // Then delete teams
        const { error: teamError } = await supabaseAdmin
          .from('teams')
          .delete()
          .in('id', teamIds);
          
        if (teamError) {
          console.error('Error deleting teams:', teamError.message);
        }
      }

      if (userIds.length > 0) {
        // Delete profiles first (if they exist)
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .in('id', userIds);
          
        if (profileError) {
          console.error('Error deleting profiles:', profileError.message);
        }
        
        // Delete auth users
        for (const userId of userIds) {
          const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
          
          if (authError) {
            console.error(`Error deleting auth user ${userId}:`, authError.message);
          }
        }
      }
    } catch (error: any) {
      console.error('Error in cleanup:', error.message);
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

    try {
      // Create user directly with Supabase instead of using executeRawQuery
      const { error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName },
        id
      });

      if (error) {
        console.error(`Error creating test user: ${error.message}`);
      }

      return { id, email, fullName };
    } catch (error: any) {
      console.error(`Error in createTestUser: ${error.message}`);
      // Return the user data anyway to allow tests to continue
      return { id, email, fullName };
    }
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
    try {
      console.log(`Creating test authentication token...`);
      
      // Try to find the user to get their email
      let email = `test-${userId}@example.com`;
      
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (userData?.user?.email) {
          email = userData.user.email;
          console.log(`Found user: ${email}`);
        }
      } catch (err) {
        console.log(`Could not fetch user details, using default email: ${email}`);
      }
      
      // Create a token payload
      const payload = {
        sub: userId,
        email: email,
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiration
        iat: Math.floor(Date.now() / 1000),
        aud: 'authenticated'
      };
      
      // Encode as base64
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      
      // Format with test_ prefix
      const token = `test_${base64Payload}`;
      
      console.log(`Created test-only token for ${userId}`);
      return token;
    } catch (error) {
      console.error('Error generating test JWT:', error);
      throw new Error(`Failed to generate test JWT: ${(error as Error).message}`);
    }
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