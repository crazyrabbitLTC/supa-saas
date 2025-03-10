/**
 * @file API Test Database Setup
 * @version 0.1.0
 * 
 * Setup for integration tests with real Supabase instance
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@supabase/supabase-js';

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

// Note: We're standardizing on the Supabase client for all database operations
// and removing direct Postgres/Drizzle usage for consistency

// Test data tracking for cleanup
interface TestIds {
  userIds: string[];
  teamIds: string[];
  profileIds: string[];
  teamMemberIds: string[];
  invitationIds: string[];
}

// Define UserData interface for createUser function
interface UserData {
  id: string;
  email: string;
  password: string;
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
   * Set up the test database environment
   */
  async setupTestDb(): Promise<void> {
    // Verify connection to Supabase
    const { data, error } = await supabaseAdmin.auth.getSession();
    
    if (error) {
      throw new Error(`Failed to connect to Supabase: ${error.message}`);
    }
    
    console.log('Connected to Supabase for integration tests');
    
    // Check if teams table exists
    try {
      console.log('Checking if teams table exists...');
      const { data: teamsData, error: teamsError } = await supabaseAdmin
        .from('teams')
        .select('id')
        .limit(1);
        
      if (teamsError) {
        console.log('Teams table does not exist, creating tables...');
        
        // Use Supabase stored procedures to create necessary tables
        const { error: createTablesError } = await supabaseAdmin.rpc('create_test_tables');
        
        if (createTablesError) {
          console.error('Error creating tables:', createTablesError);
          throw new Error(`Failed to create test tables: ${createTablesError.message}`);
        }
        
        console.log('Tables created successfully');
      } else {
        console.log('Teams table already exists');
      }
    } catch (error) {
      console.error('Error setting up test database:', error);
      throw error;
    }
  }

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
    
    console.log(`Creating test user with email: ${email}`);
    
    try {
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
        console.error(`Failed to create test user: ${authError.message}`);
        throw new Error(`Failed to create test user: ${authError.message}`);
      }

      const userId = authData.user.id;
      this.testIds.userIds.push(userId);
      
      console.log(`Successfully created user with ID: ${userId}`);
      
      // Check if profile exists
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') {
        console.error(`Error checking profile: ${profileError.message}`);
      }
      
      // Create profile if it doesn't exist
      if (!profileData) {
        console.log(`Profile not found for user ${userId}, creating one...`);
        const { data: newProfile, error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            username: `user-${Date.now()}`,
            full_name: overrides.userData?.full_name || `Test User ${Date.now()}`,
            avatar_url: '',
            website: '',
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (insertError) {
          console.error(`Failed to create profile: ${insertError.message}`);
        } else {
          console.log(`Successfully created profile for user ${userId}`);
          this.testIds.profileIds.push(userId);
        }
      } else {
        console.log(`Profile already exists for user ${userId}`);
      }

      // Generate a simple token for testing
      // In a real app, you'd use a proper JWT
      const token = Buffer.from(`${userId}:${Date.now()}`).toString('base64');

      return {
        id: userId,
        email,
        token
      };
    } catch (err) {
      console.error('Unexpected error in createTestUser:', err);
      throw err;
    }
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
    
    // Debug log to see what's going on
    console.log('Creating test team with params:', { userId, name, isPersonal });
    
    try {
      // Create the team data object
      const teamData = {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        personal_user_id: isPersonal ? userId : null,
        is_personal: isPersonal,
        subscription_tier: 'free'
      };
      
      console.log('Team data to insert:', teamData);
      
      // Insert team using Supabase client
      const { data, error } = await supabaseAdmin
        .from('teams')
        .insert(teamData)
        .select()
        .single();

      // Debug log any error
      if (error) {
        console.error('Error creating team with Supabase:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to create test team with Supabase: ${error.message}`);
      }

      if (!data) {
        console.error('No data returned from team creation');
        throw new Error('Failed to create test team: No data returned');
      }

      console.log('Successfully created team with Supabase:', data);
      
      const teamId = data.id;
      this.testIds.teamIds.push(teamId);

      // Add owner as team member
      console.log('Adding team member with role owner:', { teamId, userId });
      const { data: memberData, error: memberError } = await supabaseAdmin
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role: 'owner'
        })
        .select();

      if (memberError) {
        console.error('Error adding team member:', memberError);
        console.error('Error details:', JSON.stringify(memberError, null, 2));
        throw new Error(`Failed to add owner to team: ${memberError.message}`);
      }

      console.log('Successfully added team member:', memberData);

      return {
        id: teamId,
        name: data.name,
        ownerId: userId
      };
    } catch (error: any) {
      console.error('Unexpected error in createTestTeam:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
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
  async createTeamInvitation(teamId: string, email: string, createdBy: string, role: 'owner' | 'admin' | 'member' = 'member'): Promise<string> {
    const { data, error } = await supabaseAdmin
      .from('team_invitations')
      .insert({
        team_id: teamId,
        email,
        role,
        created_by: createdBy,
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
      // Disable RLS using Supabase
      await supabaseAdmin.rpc('disable_rls_for_tests', { table_name: 'teams' });

      await supabaseAdmin
        .from('teams')
        .delete()
        .in('id', this.testIds.teamIds);
      
      // Re-enable RLS using Supabase
      await supabaseAdmin.rpc('enable_rls_for_tests', { table_name: 'teams' });
      
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
    try {
      console.log(`Generating auth header for user: ${userId}`);
      
      // Check if user exists
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userError || !userData.user) {
        console.error(`User not found: ${userError?.message || 'No user data'}`);
        throw new Error(`User not found: ${userError?.message || 'No user data'}`);
      }
      
      console.log(`Found user: ${userData.user.email}`);
      
      // Skip trying to generate a real JWT via Supabase and go straight to our test tokens
      // This is more reliable for testing since it doesn't require complex Supabase interaction
      console.log('Creating test authentication token...');
      
      // For test environment only - create a bearer token that will be accepted by our modified auth middleware
      const testOnlyToken = Buffer.from(JSON.stringify({
        sub: userId,
        email: userData.user.email,
        role: 'authenticated',
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      })).toString('base64');
      
      console.log(`Created test-only token for ${userId}`);
      
      return {
        Authorization: `Bearer test_${testOnlyToken}`
      };
    } catch (error) {
      console.error('Error generating auth header:', error);
      throw error;
    }
  }
}

export const testDb = new TestDatabase();

/**
 * Setup function to be called before tests (for backward compatibility)
 */
export async function setupTestDb(): Promise<void> {
  return testDb.setupTestDb();
}

/**
 * Teardown function to be called after tests
 */
export async function teardownTestDb(): Promise<void> {
  // Clean up any remaining test data
  await testDb.cleanup();
  
  console.log('Closed database connection');
}

export async function createUser(
  supabase: SupabaseClient<Database>,
  userData?: Partial<UserData>
): Promise<UserData> {
  console.log("Creating test user...");
  
  const email = userData?.email || `test-${uuidv4()}@example.com`;
  const password = userData?.password || "password123";
  
  console.log(`Attempting to create user with email: ${email}`);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Error creating user:", error.message);
      console.error("Error details:", JSON.stringify(error));
      throw error;
    }

    if (!data.user) {
      console.error("No user returned from signUp");
      throw new Error("Failed to create user");
    }

    console.log(`User created successfully with ID: ${data.user.id}`);
    
    // Check if profile exists
    console.log("Checking if profile exists...");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();
      
    if (profileError) {
      console.error("Error checking profile:", profileError.message);
    } else {
      console.log("Profile status:", profile ? "exists" : "does not exist");
    }

    return {
      id: data.user.id,
      email,
      password,
    };
  } catch (error) {
    console.error("Unexpected error in createUser:", error);
    throw error;
  }
}