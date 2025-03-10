/**
 * @file Error Handler Middleware
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Global error handler for the API server.
 * 
 * IMPORTANT:
 * - This handler catches all errors thrown in routes
 * - Custom error types should be handled here
 * 
 * Functionality:
 * - Formats error responses consistently
 * - Handles different error types
 * - Logs errors for debugging
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Global error handler for Fastify
 * @param error The error that was thrown
 * @param request The request that caused the error
 * @param reply The reply object to send the response
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log the error
  logger.error({
    err: error,
    request: {
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query,
    },
  }, 'Request error');

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation error',
      details: error.errors,
    });
  }

  // Handle Fastify validation errors
  if (error.validation) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation error',
      details: error.validation,
    });
  }

  // Handle 404 errors
  if (error.statusCode === 404) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'Resource not found',
    });
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const errorMessage = error.message || 'Internal Server Error';
  
  // Don't expose internal error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  return reply.status(statusCode).send({
    statusCode,
    error: error.name || 'Error',
    message: errorMessage,
    ...(isProduction ? {} : { stack: error.stack }),
  });
} 