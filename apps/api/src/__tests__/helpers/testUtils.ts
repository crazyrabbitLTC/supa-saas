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
  // Build server without starting it
  const server = await buildServer();
  
  // Create supertest instance
  const request = supertest(server.server);
  
  // Authentication utilities
  const auth = {
    /**
     * Get authorization header with JWT for user
     */
    getAuthHeader: async (userId: string): Promise<{ Authorization: string }> => {
      const jwt = await testDb.getTestJwt(userId);
      return { Authorization: `Bearer ${jwt}` };
    },
    
    /**
     * Create a test user
     */
    createTestUser: testDb.createTestUser
  };
  
  return {
    server,
    request,
    auth,
    cleanup: testDb.cleanup
  };
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
    base: '/teams',
    byId: (id: string) => `/teams/${id}`,
    members: (id: string) => `/teams/${id}/members`,
    member: (teamId: string, userId: string) => `/teams/${teamId}/members/${userId}`,
    invitations: (id: string) => `/teams/${id}/invitations`,
    invitation: (teamId: string, invitationId: string) => `/teams/${teamId}/invitations/${invitationId}`,
    subscription: (id: string) => `/teams/${id}/subscription`
  },
  invitations: {
    verify: (token: string) => `/invitations/${token}`,
    accept: (token: string) => `/invitations/${token}/accept`
  },
  subscriptionTiers: '/subscription-tiers'
}; 