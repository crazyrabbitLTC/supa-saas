/**
 * @file Metrics Job
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Cron job for collecting and reporting metrics.
 * 
 * IMPORTANT:
 * - This job runs on a schedule to collect metrics
 * - It should be idempotent and handle failures gracefully
 * 
 * Functionality:
 * - Schedules a metrics collection job
 * - Collects metrics from the database
 * - Reports metrics (e.g., to a monitoring service)
 */

import cron from 'node-cron';
import { logger } from '../utils/logger';
import { db, profiles } from 'database';
import { count } from 'drizzle-orm';

/**
 * Schedules the metrics job
 */
export function scheduleMetricsJob(): void {
  // Schedule job to run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Running metrics job');
      await collectMetrics();
      logger.info('Metrics job completed successfully');
    } catch (error) {
      logger.error(error, 'Error running metrics job');
    }
  });
  
  logger.info('Metrics job scheduled');
}

/**
 * Collects and reports metrics
 */
async function collectMetrics(): Promise<void> {
  logger.info('Collecting metrics');
  
  try {
    // Example: Count total profiles
    const result = await db.select({ count: count() }).from(profiles);
    const profileCount = result[0]?.count || 0;
    
    // Log the metrics
    logger.info({ profileCount }, 'Collected metrics');
    
    // In a real application, you might send these metrics to a monitoring service
    // await sendMetricsToMonitoringService({ profileCount });
    
  } catch (error) {
    logger.error(error, 'Error collecting metrics');
    throw error;
  }
} 