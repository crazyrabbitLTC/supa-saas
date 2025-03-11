/**
 * @file API Test Utilities
 * @version 0.1.0
 * 
 * Utility functions for API testing.
 */

import { FastifyInstance } from 'fastify';
import { buildServer } from '../../server';
import { testDb } from '../../../../../packages/database/src/__tests__/setup';
import supertest from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { registerRoutes } from '../../routes';
import { healthRoutes } from '../../routes/health';
import { profileRoutes } from '../../routes/profiles';
import { teamRoutes, invitationRoutes } from '../../routes/teams';

/**
 * Initialize a test server for API tests
 */
export async function initTestServer(): Promise<{
  server: FastifyInstance;
  request: supertest.SuperTest<supertest.Test>;
  auth: {
    getAuthHeader: (userId: string) => Promise<{ Authorization: string }>;
    createTestUser: typeof testDb.createTestUser;
  };
  cleanup: (ids: { teamIds?: string[]; userIds?: string[]; invitationIds?: string[] }) => Promise<void>;
}> {
  console.log('=== INITIALIZING TEST SERVER ===');
  
  try {
    // Build server without starting it
    console.log('Building server...');
    const server = await buildServer({ skipRouteRegistration: true });
    console.log('Server built successfully');

    // Debug server instance before route registration
    console.log('=== SERVER STATE BEFORE ROUTE REGISTRATION ===');
    
    // Inspect hooks
    // @ts-ignore - Accessing Fastify internals for debugging
    const preHooks = server.hasOwnProperty('_hooks') ? server['_hooks'] : {};
    console.log('Pre-registration hooks:');
    Object.keys(preHooks).forEach(hookName => {
      console.log(`  Hook: ${hookName}, Handlers: ${preHooks[hookName]?.length || 0}`);
      if (preHooks[hookName]?.length > 0) {
        console.log(`    Handler sources: ${preHooks[hookName].map((h: any) => h.source || 'unknown').join(', ')}`);
      }
    });
    
    // Inspect plugins 
    // @ts-ignore - Accessing Fastify internals for debugging
    const plugins = server.hasOwnProperty('_plugins') ? server['_plugins'] : [];
    console.log('Registered plugins:');
    plugins.forEach((plugin: any, index: number) => {
      console.log(`  Plugin ${index + 1}: ${plugin.name || 'unnamed'}`);
    });
    
    // Add delay to ensure asynchronous plugin initialization completes
    console.log('Adding delay to ensure plugin initialization completes...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Delay completed');
    
    // Manually register routes to ensure they're properly registered
    console.log('Manually registering routes...');
    
    // Register health check routes
    console.log('Registering health check routes...');
    await server.register(healthRoutes, { prefix: '/health' });
    console.log('Health check routes registered');
    
    // Register API routes with version prefix
    console.log('Registering API routes with version prefix...');
    await server.register(
      async (api) => {
        // Register profile routes
        console.log('Registering profile routes...');
        await api.register(profileRoutes, { prefix: '/profiles' });
        console.log('Profile routes registered');
        
        // Register team routes
        console.log('Registering team routes...');
        await api.register(teamRoutes, { prefix: '/teams' });
        console.log('Team routes registered');
        
        // Register invitation routes
        console.log('Registering invitation routes...');
        await api.register(invitationRoutes, { prefix: '/invitations' });
        console.log('Invitation routes registered');
      },
      { prefix: '/api/v1' }
    );
    console.log('API routes registered with version prefix');
    
    // Add delay after route registration
    console.log('Adding delay after route registration...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Delay completed');
    
    // Debug server instance after route registration  
    console.log('=== SERVER STATE AFTER ROUTE REGISTRATION ===');
    
    // Inspect hooks after registration
    // @ts-ignore - Accessing Fastify internals for debugging
    const postHooks = server.hasOwnProperty('_hooks') ? server['_hooks'] : {};
    console.log('Post-registration hooks:');
    Object.keys(postHooks).forEach(hookName => {
      console.log(`  Hook: ${hookName}, Handlers: ${postHooks[hookName]?.length || 0}`);
      if (postHooks[hookName]?.length > 0) {
        console.log(`    Handler sources: ${postHooks[hookName].map((h: any) => h.source || 'unknown').join(', ')}`);
      }
    });
    
    // Log registered routes after manual registration
    console.log('=== REGISTERED ROUTES AFTER MANUAL REGISTRATION ===');
    const routes = server.printRoutes ? server.printRoutes() : server.getRoutes();
    
    if (typeof routes === 'string') {
      // If printRoutes returns a string, log it directly
      console.log(routes);
    } else {
      // If getRoutes returns an array, format and log each route
      routes.forEach((route: any) => {
        console.log(`${route.method} ${route.url}`);
      });
    }
    console.log('=========================');

    // Ensure server is ready for requests (internal fastify ready event)
    console.log('Awaiting server ready state...');
    await server.ready();
    console.log('Server ready');
    
    // Create supertest instance
    console.log('Creating supertest instance...');
    const request = supertest(server.server);
    console.log('Supertest instance created');
    
    // Authentication utilities
    console.log('Setting up authentication utilities...');
    const auth = {
      /**
       * Get authorization header with JWT for user
       */
      getAuthHeader: async (userId: string): Promise<{ Authorization: string }> => {
        console.log(`Generating auth header for user: ${userId}`);
        const jwt = await testDb.getTestJwt(userId);
        return { Authorization: `Bearer ${jwt}` };
      },
      
      /**
       * Create a test user
       */
      createTestUser: testDb.createTestUser
    };
    console.log('Authentication utilities set up');
    
    console.log('=== TEST SERVER INITIALIZATION COMPLETE ===');
    
    return {
      server,
      request,
      auth,
      cleanup: testDb.cleanup
    };
  } catch (error) {
    console.error('=== ERROR INITIALIZING TEST SERVER ===');
    console.error(error);
    throw error;
  }
}

/**
 * Type for test data generator options
 */
interface TestDataOptions {
  userId?: string;
  teamId?: string;
  teamName?: string;
  teamSlug?: string;
  isPersonal?: boolean;
  role?: 'owner' | 'admin' | 'member';
  subscriptionTier?: 'free' | 'basic' | 'pro' | 'enterprise';
}

/**
 * Generate test data for API tests
 */
export const testData = {
  /**
   * Generate a test team creation payload
   */
  createTeamPayload: (options: Partial<TestDataOptions> = {}): any => {
    return {
      name: options.teamName || `Test Team ${Date.now()}`,
      slug: options.teamSlug || `test-team-${Date.now()}`,
      description: 'API test team',
      logoUrl: 'https://example.com/logo.png',
      isPersonal: options.isPersonal || false
    };
  },
  
  /**
   * Generate a test team update payload
   */
  updateTeamPayload: (options: Partial<TestDataOptions> = {}): any => {
    return {
      name: options.teamName || `Updated Team ${Date.now()}`,
      description: 'Updated API test team',
      logoUrl: 'https://example.com/updated-logo.png',
      metadata: { updated: true, testKey: 'testValue' }
    };
  },
  
  /**
   * Generate a test invitation payload
   */
  createInvitationPayload: (email: string = `invite-${Date.now()}@example.com`, role: string = 'member'): any => {
    return {
      email,
      role
    };
  },
  
  /**
   * Generate a test update member role payload
   */
  updateMemberRolePayload: (role: string = 'admin'): any => {
    return {
      role
    };
  },
  
  /**
   * Generate a test update subscription payload
   */
  updateSubscriptionPayload: (tier: string = 'basic', subscriptionId: string = uuidv4()): any => {
    return {
      subscriptionTier: tier,
      subscriptionId
    };
  }
};

/**
 * Route URL generators for API testing
 */
export const routes = {
  teams: {
    base: '/api/v1/teams',
    byId: (id: string) => `/api/v1/teams/${id}`,
    members: (id: string) => `/api/v1/teams/${id}/members`,
    member: (teamId: string, userId: string) => `/api/v1/teams/${teamId}/members/${userId}`,
    invitations: (id: string) => `/api/v1/teams/${id}/invitations`,
    invitation: (teamId: string, invitationId: string) => `/api/v1/teams/${teamId}/invitations/${invitationId}`,
    subscription: (id: string) => `/api/v1/teams/${id}/subscription`
  },
  invitations: {
    verify: (token: string) => `/api/v1/invitations/${token}`,
    accept: (token: string) => `/api/v1/invitations/${token}/accept`
  },
  subscriptionTiers: '/api/v1/subscription-tiers'
}; 