/**
 * @file Background Services Entry Point
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Main entry point for background services.
 * 
 * IMPORTANT:
 * - Services are configured from environment variables
 * - Jobs are registered and scheduled here
 * 
 * Functionality:
 * - Initializes the service
 * - Schedules cron jobs
 * - Handles graceful shutdown
 */

import { servicesEnv } from 'config';
import { logger } from './utils/logger';
import { scheduleCronJobs } from './jobs';

// Start the service
const start = async () => {
  try {
    logger.info('Starting background services');
    
    // Schedule cron jobs if enabled
    if (servicesEnv.SERVICES_CRON_ENABLED) {
      logger.info('Cron jobs enabled, scheduling jobs');
      scheduleCronJobs();
    } else {
      logger.info('Cron jobs disabled');
    }
    
    logger.info('Background services started successfully');
  } catch (err) {
    logger.error(err, 'Error starting background services');
    process.exit(1);
  }
};

// Handle graceful shutdown
const shutdown = () => {
  logger.info('Shutting down background services');
  // Perform any cleanup here
  process.exit(0);
};

// Handle process signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error(err, 'Unhandled rejection');
  process.exit(1);
});

// Start the service
start(); 