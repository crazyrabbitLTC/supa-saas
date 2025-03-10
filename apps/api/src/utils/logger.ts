/**
 * @file Logger Utility
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Configures the logger for the API server.
 * 
 * IMPORTANT:
 * - Use this logger throughout the application
 * - Do not create multiple logger instances
 * 
 * Functionality:
 * - Provides a configured Pino logger
 * - Formats logs for development and production
 */

import pino from 'pino';

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Configure logger
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
}); 