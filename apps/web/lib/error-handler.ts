/**
 * @file Error Handling Utility
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-06-15
 * 
 * Centralized error handling utility for consistent error management.
 * 
 * IMPORTANT:
 * - Any modification requires extensive testing
 * - Error codes must remain consistent
 * 
 * Functionality:
 * - Custom error classes for different error types
 * - Standardized error codes
 * - Error mapping between internal and external formats
 * - Consistent error logging
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  public code: string
  public status: number
  public details?: Record<string, any>

  constructor(message: string, code: string, status = 500, details?: Record<string, any>) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.status = status
    this.details = details
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

/**
 * Authentication error class
 */
export class AuthError extends AppError {
  constructor(message: string, code = 'AUTH_ERROR', status = 401, details?: Record<string, any>) {
    super(message, code, status, details)
    Object.setPrototypeOf(this, AuthError.prototype)
  }
}

/**
 * Authorization error class
 */
export class ForbiddenError extends AppError {
  constructor(message: string, code = 'FORBIDDEN', status = 403, details?: Record<string, any>) {
    super(message, code, status, details)
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(message: string, code = 'NOT_FOUND', status = 404, details?: Record<string, any>) {
    super(message, code, status, details)
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message: string, code = 'VALIDATION_ERROR', status = 400, details?: Record<string, any>) {
    super(message, code, status, details)
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * Rate limit error class
 */
export class RateLimitError extends AppError {
  constructor(message: string, code = 'RATE_LIMIT_EXCEEDED', status = 429, details?: Record<string, any>) {
    super(message, code, status, details)
    Object.setPrototypeOf(this, RateLimitError.prototype)
  }
}

/**
 * CSRF error class
 */
export class CSRFError extends AppError {
  constructor(message: string, code = 'CSRF_ERROR', status = 403, details?: Record<string, any>) {
    super(message, code, status, details)
    Object.setPrototypeOf(this, CSRFError.prototype)
  }
}

/**
 * Server error class
 */
export class ServerError extends AppError {
  constructor(message: string, code = 'SERVER_ERROR', status = 500, details?: Record<string, any>) {
    super(message, code, status, details)
    Object.setPrototypeOf(this, ServerError.prototype)
  }
}

/**
 * Database error class
 */
export class DatabaseError extends AppError {
  constructor(message: string, code = 'DATABASE_ERROR', status = 500, details?: Record<string, any>) {
    super(message, code, status, details)
    Object.setPrototypeOf(this, DatabaseError.prototype)
  }
}

/**
 * External service error class
 */
export class ExternalServiceError extends AppError {
  constructor(message: string, code = 'EXTERNAL_SERVICE_ERROR', status = 502, details?: Record<string, any>) {
    super(message, code, status, details)
    Object.setPrototypeOf(this, ExternalServiceError.prototype)
  }
}

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code: string
    status: number
    details?: Record<string, any>
  }
}

/**
 * Convert an error to a standardized API error response
 * @param error - Error to convert
 * @returns Standardized API error response
 */
export function formatErrorResponse(error: unknown): ApiErrorResponse {
  // Handle AppError instances
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
        details: error.details,
      },
    }
  }
  
  // Handle standard Error instances
  if (error instanceof Error) {
    return {
      success: false,
      error: {
        message: error.message,
        code: 'UNKNOWN_ERROR',
        status: 500,
      },
    }
  }
  
  // Handle unknown error types
  return {
    success: false,
    error: {
      message: 'An unknown error occurred',
      code: 'UNKNOWN_ERROR',
      status: 500,
    },
  }
}

/**
 * Log an error with consistent formatting
 * @param error - Error to log
 * @param context - Additional context information
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  if (error instanceof AppError) {
    console.error(`[${error.code}] ${error.message}`, {
      status: error.status,
      details: error.details,
      context,
      stack: error.stack,
    })
    return
  }
  
  if (error instanceof Error) {
    console.error(`[ERROR] ${error.message}`, {
      context,
      stack: error.stack,
    })
    return
  }
  
  console.error('[UNKNOWN_ERROR]', error, { context })
}

/**
 * Authentication error codes
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  ACCOUNT_LOCKED = 'AUTH_ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED = 'AUTH_EMAIL_NOT_VERIFIED',
  PASSWORD_RESET_REQUIRED = 'AUTH_PASSWORD_RESET_REQUIRED',
  MFA_REQUIRED = 'AUTH_MFA_REQUIRED',
  INVALID_MFA_CODE = 'AUTH_INVALID_MFA_CODE',
  SOCIAL_AUTH_ERROR = 'AUTH_SOCIAL_ERROR',
}

/**
 * CSRF error codes
 */
export enum CSRFErrorCode {
  MISSING_TOKEN = 'CSRF_MISSING_TOKEN',
  INVALID_TOKEN = 'CSRF_INVALID_TOKEN',
  EXPIRED_TOKEN = 'CSRF_EXPIRED_TOKEN',
}

/**
 * Validation error codes
 */
export enum ValidationErrorCode {
  INVALID_INPUT = 'VALIDATION_INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'VALIDATION_MISSING_FIELD',
  INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  INVALID_LENGTH = 'VALIDATION_INVALID_LENGTH',
  INVALID_VALUE = 'VALIDATION_INVALID_VALUE',
}

/**
 * Create an authentication error with a specific code
 * @param message - Error message
 * @param code - Authentication error code
 * @param details - Additional error details
 * @returns Authentication error
 */
export function createAuthError(
  message: string,
  code: AuthErrorCode,
  details?: Record<string, any>
): AuthError {
  return new AuthError(message, code, 401, details)
}

/**
 * Create a CSRF error with a specific code
 * @param message - Error message
 * @param code - CSRF error code
 * @param details - Additional error details
 * @returns CSRF error
 */
export function createCSRFError(
  message: string,
  code: CSRFErrorCode,
  details?: Record<string, any>
): CSRFError {
  return new CSRFError(message, code, 403, details)
}

/**
 * Create a validation error with a specific code
 * @param message - Error message
 * @param code - Validation error code
 * @param details - Additional error details
 * @returns Validation error
 */
export function createValidationError(
  message: string,
  code: ValidationErrorCode,
  details?: Record<string, any>
): ValidationError {
  return new ValidationError(message, code, 400, details)
} 