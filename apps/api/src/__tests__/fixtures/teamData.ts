/**
 * @file Team Test Fixtures
 * @version 0.1.0
 * 
 * Fixture data for team-related tests.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Team roles
 */
export const TeamRole = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member'
} as const;

/**
 * Subscription tiers
 */
export const SubscriptionTier = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
} as const;

/**
 * Standard test users
 * Use these for consistent testing across different test files
 */
export const testUsers = {
  owner: {
    id: 'test-owner-1111-1111-1111-111111111111',
    email: 'test-owner@example.com',
    fullName: 'Test Owner'
  },
  admin: {
    id: 'test-admin-2222-2222-2222-222222222222',
    email: 'test-admin@example.com',
    fullName: 'Test Admin'
  },
  member: {
    id: 'test-member-3333-3333-3333-333333333333',
    email: 'test-member@example.com',
    fullName: 'Test Member'
  },
  nonMember: {
    id: 'test-non-member-4444-4444-4444-444444444444',
    email: 'test-non-member@example.com',
    fullName: 'Test Non-Member'
  }
};

/**
 * Standard test teams
 */
export const testTeams = {
  regular: {
    id: 'test-team-5555-5555-5555-555555555555',
    name: 'Test Regular Team',
    slug: 'test-regular-team',
    description: 'A team for testing regular team operations',
    isPersonal: false,
    subscriptionTier: SubscriptionTier.BASIC,
    ownerId: testUsers.owner.id
  },
  personal: {
    id: 'test-personal-6666-6666-6666-666666666666',
    name: 'Test Personal Team',
    slug: 'test-personal-team',
    description: 'A personal team for testing',
    isPersonal: true,
    subscriptionTier: SubscriptionTier.FREE,
    ownerId: testUsers.owner.id
  },
  enterprise: {
    id: 'test-enterprise-7777-7777-7777-777777777777',
    name: 'Test Enterprise Team',
    slug: 'test-enterprise-team',
    description: 'An enterprise team for testing subscription features',
    isPersonal: false,
    subscriptionTier: SubscriptionTier.ENTERPRISE,
    ownerId: testUsers.admin.id
  }
};

/**
 * Generate test member data
 */
export function createTestMember(teamId: string, userId: string, role: keyof typeof TeamRole) {
  return {
    teamId,
    userId,
    role: TeamRole[role],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Generate test invitation data
 */
export function createTestInvitation(
  teamId: string, 
  email: string, 
  role: keyof typeof TeamRole = 'MEMBER',
  invitedBy: string = testUsers.owner.id
) {
  return {
    id: uuidv4(),
    teamId,
    email,
    role: TeamRole[role],
    token: uuidv4(),
    invitedBy,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  };
}

/**
 * Test subscription tier data
 */
export const testSubscriptionTiers = [
  {
    id: 1,
    name: 'Free',
    code: SubscriptionTier.FREE,
    price: 0,
    memberLimit: 5,
    isTeamPlan: true,
    features: ['Basic collaboration', 'Up to 5 team members', 'Standard support'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    name: 'Basic',
    code: SubscriptionTier.BASIC,
    price: 10,
    memberLimit: 10,
    isTeamPlan: true,
    features: ['Everything in Free', 'Up to 10 team members', 'Priority support'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    name: 'Pro',
    code: SubscriptionTier.PRO,
    price: 25,
    memberLimit: 25,
    isTeamPlan: true,
    features: ['Everything in Basic', 'Up to 25 team members', 'Advanced analytics'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    name: 'Enterprise',
    code: SubscriptionTier.ENTERPRISE,
    price: 50,
    memberLimit: 100,
    isTeamPlan: true,
    features: ['Everything in Pro', 'Up to 100 team members', 'Dedicated support'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]; 