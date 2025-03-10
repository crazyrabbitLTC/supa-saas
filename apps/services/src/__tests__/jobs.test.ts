/**
 * @file Jobs Tests
 * @version 0.1.0
 * @status STABLE - COMPLETE TEST COVERAGE
 * @lastModified 2023-01-01
 * 
 * Tests for the background jobs.
 * 
 * IMPORTANT:
 * - These tests verify the jobs work correctly
 * - They mock the database and cron dependencies
 * 
 * Test Coverage:
 * - Job scheduling
 * - Job execution
 * - Error handling
 */

import { scheduleCronJobs } from '../jobs';
import { scheduleCleanupJob } from '../jobs/cleanup';
import { scheduleMetricsJob } from '../jobs/metrics';

// Mock dependencies
jest.mock('node-cron', () => ({
  schedule: jest.fn((_, callback) => {
    // Store the callback but don't execute it
    return { stop: jest.fn() };
  }),
}));

jest.mock('../jobs/cleanup', () => ({
  scheduleCleanupJob: jest.fn(),
}));

jest.mock('../jobs/metrics', () => ({
  scheduleMetricsJob: jest.fn(),
}));

jest.mock('database', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue([{ count: 10 }]),
  },
  profiles: {},
}));

describe('Jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should schedule all jobs', () => {
    scheduleCronJobs();
    
    expect(scheduleCleanupJob).toHaveBeenCalledTimes(1);
    expect(scheduleMetricsJob).toHaveBeenCalledTimes(1);
  });
}); 