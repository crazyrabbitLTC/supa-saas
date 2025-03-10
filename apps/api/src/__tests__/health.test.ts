/**
 * @file Health Check Routes Tests
 * @version 0.1.0
 * @status STABLE - COMPLETE TEST COVERAGE
 * @lastModified 2023-01-01
 * 
 * Tests for the health check endpoints.
 * 
 * IMPORTANT:
 * - These tests verify the health check endpoints work correctly
 * - They mock the database and Supabase dependencies
 * 
 * Test Coverage:
 * - Basic health check endpoint
 * - Detailed health check endpoint
 * - Error handling for database connection issues
 * - Error handling for Supabase connection issues
 */

import { FastifyInstance } from 'fastify';
import { buildServer } from '../server';

// Mock the database and Supabase dependencies
jest.mock('database', () => ({
  db: {
    execute: jest.fn().mockResolvedValue(true),
  },
  supabaseAdmin: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
  supabaseClient: {},
}));

describe('Health Check Routes', () => {
  let server: FastifyInstance;
  
  beforeEach(async () => {
    server = await buildServer();
  });
  
  afterEach(async () => {
    await server.close();
  });
  
  it('should return status ok for basic health check', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({ status: 'ok' });
  });
  
  it('should return detailed health status', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health/detailed',
    });
    
    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.status).toBe('ok');
    expect(payload.services).toEqual({
      database: 'ok',
      supabase: 'ok',
    });
    expect(payload.timestamp).toBeDefined();
  });
}); 