/**
 * @file API Test Database Setup
 * @version 0.1.0
 * 
 * Setup for integration tests with real Supabase instance
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const databaseUrl = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';

if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for integration tests');
}

// Create Supabase client with service role key for admin access
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create Postgres client for direct database access
const queryClient = postgres(databaseUrl, { max: 1 });
export const db = drizzle(queryClient);

// Test data tracking for cleanup
interface TestIds {
  userIds: string[];
  teamIds: string[];
  profileIds: string[];
  teamMemberIds: string[];
  invitationIds: string[];
}

/**
 * Test database utilities for integration tests
 */
class TestDatabase {
  private testIds: TestIds = {
    userIds: [],
    teamIds: [],
    profileIds: [],
    teamMemberIds: [],
    invitationIds: []
  };

  /**
   * Generate a unique name for test data
   */
  uniqueName(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Create a test user with Supabase Auth
   */
  async createTestUser(overrides: Partial<{
    email: string;
    password: string;
    userData: Record<string, any>;
  }> = {}): Promise<{
    id: string;
    email: string;
    token: string;
  }> {
    const email = overrides.email || `test-${uuidv4()}@example.com`;
    const password = overrides.password || 'Password123!';
    
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: overrides.userData || {
        full_name: `Test User ${Date.now()}`
      }
    });

    if (authError) {
      throw new Error(`Failed to create test user: ${authError.message}`);
    }

    const userId = authData.user.id;
    this.testIds.userIds.push(userId);

    // Get auth token for the user
    const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email
    });

    if (tokenError) {
      throw new Error(`Failed to generate token for test user: ${tokenError.message}`);
    }

    return {
      id: userId,
      email,
      token: tokenData.properties.hashed_token
    };
  }

  /**
   * Create a test team
   */
  async createTestTeam(userId: string, overrides: Partial<{
    name: string;
    isPersonal: boolean;
  }> = {}): Promise<{
    id: string;
    name: string;
    ownerId: string;
  }> {
    const name = overrides.name || this.uniqueName('test-team');
    const isPersonal = overrides.isPersonal !== undefined ? overrides.isPersonal : false;
    
    // Insert team directly into database
    const { data, error } = await supabaseAdmin
      .from('teams')
      .insert({
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        owner_id: userId,
        is_personal: isPersonal,
        subscription_tier: 'free'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test team: ${error.message}`);
    }

    const teamId = data.id;
    this.testIds.teamIds.push(teamId);

    // Add owner as team member
    const { error: memberError } = await supabaseAdmin
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role: 'owner'
      });

    if (memberError) {
      throw new Error(`Failed to add owner to team: ${memberError.message}`);
    }

    return {
      id: teamId,
      name: data.name,
      ownerId: userId
    };
  }

  /**
   * Add a member to a team
   */
  async addTeamMember(teamId: string, userId: string, role: 'owner' | 'admin' | 'member' = 'member'): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add team member: ${error.message}`);
    }

    this.testIds.teamMemberIds.push(data.id);
    return data.id;
  }

  /**
   * Create a team invitation
   */
  async createTeamInvitation(teamId: string, email: string, invitedBy: string, role: 'owner' | 'admin' | 'member' = 'member'): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('team_invitations')
      .insert({
        team_id: teamId,
        email,
        role,
        invited_by: invitedBy,
        token: uuidv4()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create team invitation: ${error.message}`);
    }

    this.testIds.invitationIds.push(data.id);
    return data.id;
  }

  /**
   * Clean up all test data
   */
  async cleanup(): Promise<void> {
    // Clean up in reverse order of dependencies
    if (this.testIds.invitationIds.length > 0) {
      await supabaseAdmin
        .from('team_invitations')
        .delete()
        .in('id', this.testIds.invitationIds);
      this.testIds.invitationIds = [];
    }

    if (this.testIds.teamMemberIds.length > 0) {
      await supabaseAdmin
        .from('team_members')
        .delete()
        .in('id', this.testIds.teamMemberIds);
      this.testIds.teamMemberIds = [];
    }

    if (this.testIds.teamIds.length > 0) {
      // First remove RLS protection for test cleanup
      await db.execute(sql`
        DO $$
        BEGIN
          -- Temporarily disable RLS for cleanup
          ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
        END $$;
      `);

      await supabaseAdmin
        .from('teams')
        .delete()
        .in('id', this.testIds.teamIds);
      
      // Re-enable RLS
      await db.execute(sql`
        DO $$
        BEGIN
          -- Re-enable RLS
          ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
        END $$;
      `);
      
      this.testIds.teamIds = [];
    }

    if (this.testIds.profileIds.length > 0) {
      await supabaseAdmin
        .from('profiles')
        .delete()
        .in('id', this.testIds.profileIds);
      this.testIds.profileIds = [];
    }

    if (this.testIds.userIds.length > 0) {
      for (const userId of this.testIds.userIds) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }
      this.testIds.userIds = [];
    }
  }

  /**
   * Get an auth header for a user
   */
  async getAuthHeader(userId: string): Promise<{ Authorization: string }> {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: `temp-${uuidv4()}@example.com`,
      user_metadata: { temp: true },
      email_confirm: true
    });

    if (error) {
      throw new Error(`Failed to create temporary user: ${error.message}`);
    }

    // Get JWT token for the user
    const jwt = await this.generateJwtForUser(userId);
    
    // Clean up temporary user
    await supabaseAdmin.auth.admin.deleteUser(data.user.id);
    
    return {
      Authorization: `Bearer ${jwt}`
    };
  }

  /**
   * Generate a JWT token for a user
   */
  private async generateJwtForUser(userId: string): Promise<string> {
    // This is a simplified approach - in a real implementation, you would use
    // the Supabase JWT generation mechanism or a proper JWT library
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: `temp-${uuidv4()}@example.com`,
      options: {
        data: {
          sub: userId
        }
      }
    });

    if (error) {
      throw new Error(`Failed to generate JWT: ${error.message}`);
    }

    // Extract token from URL
    const url = new URL(data.properties.action_link);
    const token = url.searchParams.get('token');
    
    if (!token) {
      throw new Error('Failed to extract token from action link');
    }
    
    return token;
  }
}

export const testDb = new TestDatabase();

/**
 * Setup function to be called before tests
 */
export async function setupTestDb(): Promise<void> {
  // Verify connection to Supabase
  const { data, error } = await supabaseAdmin.auth.getSession();
  
  if (error) {
    throw new Error(`Failed to connect to Supabase: ${error.message}`);
  }
  
  console.log('Connected to Supabase for integration tests');
}

/**
 * Teardown function to be called after tests
 */
export async function teardownTestDb(): Promise<void> {
  // Clean up any remaining test data
  await testDb.cleanup();
  
  // Close database connection
  await queryClient.end();
  
  console.log('Closed database connection');
} 