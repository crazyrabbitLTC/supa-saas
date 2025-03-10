/**
 * @file Debug Simple Test
 * 
 * A minimal test to just check if the API server works
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initTestServer } from './setup/testServer';
import { createUser } from './setup/testDb';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from './setup/testDb';
import { db } from 'database/src/client';
import { sql } from 'drizzle-orm';

describe('Debug Simple API', () => {
  // Test context to store server, request client, and test data
  const testContext: {
    server?: any;
    request?: any;
  } = {};

  // Setup before all tests
  beforeAll(async () => {
    console.log('Setting up test server...');
    const { server, request } = await initTestServer();
    testContext.server = server;
    testContext.request = request;
  });

  it('should connect to API', async () => {
    // Just test if we can make a simple request to the health endpoint
    const response = await testContext.request.get('/api/v1/profiles');
    
    console.log('Response from profiles endpoint:', {
      status: response.status,
      body: response.body
    });
    
    // We expect 401 because we're not authenticated
    expect(response.status).toBe(401);
  });
}); 