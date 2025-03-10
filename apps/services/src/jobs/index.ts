/**
 * @file Jobs Index
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Registers and schedules all cron jobs.
 * 
 * IMPORTANT:
 * - Add new jobs here
 * - Keep jobs organized by feature
 * 
 * Functionality:
 * - Schedules all cron jobs
 * - Provides a central place to manage jobs
 */

import { logger } from '../utils/logger';
import { scheduleCleanupJob } from './cleanup';
import { scheduleMetricsJob } from './metrics';

/**
 * Schedules all cron jobs
 */
export function scheduleCronJobs(): void {
  logger.info('Scheduling cron jobs');
  
  // Schedule cleanup job
  scheduleCleanupJob();
  
  // Schedule metrics job
  scheduleMetricsJob();
  
  logger.info('All cron jobs scheduled');
} 