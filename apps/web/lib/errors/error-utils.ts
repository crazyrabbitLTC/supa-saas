/**
 * @file Error Handling Utilities
 * @description Utility functions for handling and formatting errors
 */

import { NextResponse } from 'next/server';
import { 
  AppError, 
  AuthError, 
  ValidationError, 
  NotFoundError, 
  ForbiddenError,
  CSRFError,
  RateLimitError,
  ServerError,
  DatabaseError,
  ExternalServiceError
} from './custom-errors';

/**
 * Type for error response object
 */
export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    fields?: Record<string, string>;
    statusCode: number;
  };
}

/**
 * Check if an error is an instance of AppError
 * @param error The error to check
 * @returns True if the error is an AppError, false otherwise
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Check if an error is an instance of AuthError
 * @param error The error to check
 * @returns True if the error is an AuthError, false otherwise
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Check if an error is an instance of ValidationError
 * @param error The error to check
 * @returns True if the error is a ValidationError, false otherwise
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Format an error into a consistent error response object
 * @param error The error to format
 * @returns A formatted error response object
 */
export function formatErrorResponse(error: unknown): ErrorResponse {
  if (isAppError(error)) {
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        ...(isValidationError(error) && error.fields ? { fields: error.fields } : {})
      }
    };
  }
  
  // Handle unknown errors
  const unknownError = error instanceof Error ? error : new Error('Unknown error');
  
  return {
    error: {
      message: unknownError.message,
      code: 'unknown_error',
      statusCode: 500
    }
  };
}

/**
 * Create a NextResponse with the appropriate error status and body
 * @param error The error to format
 * @returns A NextResponse with the error details
 */
export function createErrorResponse(error: unknown): NextResponse {
  const errorResponse = formatErrorResponse(error);
  const statusCode = errorResponse.error.statusCode;
  
  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Log an error to the console or error tracking service
 * @param error The error to log
 * @param context Additional context for the error
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  if (isAppError(error)) {
    console.error(`[${error.code}] ${error.message}`, { 
      statusCode: error.statusCode,
      ...(isValidationError(error) && error.fields ? { fields: error.fields } : {}),
      ...context
    });
  } else {
    console.error('[unknown_error]', error, context);
  }
  
  // In a production environment, you would send this to an error tracking service
  // like Sentry, LogRocket, etc.
}

/**
 * Higher-order function to wrap API route handlers with error handling
 * @param handler The API route handler to wrap
 * @returns A wrapped handler with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): (...args: Parameters<T>) => Promise<NextResponse> {
  return async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      logError(error, { path: args[0]?.nextUrl?.pathname });
      return createErrorResponse(error);
    }
  };
}

/**
 * Handle authentication errors
 * @param error The error to handle
 * @returns A formatted error object
 */
export function handleAuthError(error: unknown): { message: string; code: string } {
  if (isAuthError(error)) {
    return {
      message: error.message,
      code: error.code
    };
  }
  
  return {
    message: 'Authentication failed',
    code: 'auth_error'
  };
}

/**
 * Handle validation errors
 * @param error The error to handle
 * @returns A formatted error object with field errors
 */
export function handleValidationError(error: unknown): { 
  message: string; 
  fields: Record<string, string>;
  code: string;
} {
  if (isValidationError(error)) {
    return {
      message: error.message,
      fields: error.fields || {},
      code: error.code
    };
  }
  
  return {
    message: 'Validation failed',
    fields: {},
    code: 'validation_error'
  };
}

/**
 * Handle server errors
 * @param error The error to handle
 * @returns A formatted error object
 */
export function handleServerError(error: unknown): { message: string; code: string } {
  if (isAppError(error)) {
    return {
      message: error.message,
      code: error.code
    };
  }
  
  // For unknown errors, provide a generic message
  return {
    message: 'An unexpected error occurred',
    code: 'server_error'
  };
} 