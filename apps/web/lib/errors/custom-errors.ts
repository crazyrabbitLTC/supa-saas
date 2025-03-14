/**
 * @file Custom Error Classes
 * @description Defines custom error classes for different error types
 */

/**
 * Base class for all application errors
 */
export class AppError extends Error {
  public code: string;
  public statusCode: number;
  
  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication-related errors
 */
export class AuthError extends AppError {
  constructor(message: string, code: string = 'auth_error', statusCode: number = 401) {
    super(message, code, statusCode);
  }
}

/**
 * Validation errors for form inputs, API requests, etc.
 */
export class ValidationError extends AppError {
  public fields?: Record<string, string>;
  
  constructor(
    message: string, 
    fields?: Record<string, string>, 
    code: string = 'validation_error', 
    statusCode: number = 400
  ) {
    super(message, code, statusCode);
    this.fields = fields;
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends AppError {
  constructor(message: string, code: string = 'not_found', statusCode: number = 404) {
    super(message, code, statusCode);
  }
}

/**
 * Permission denied errors
 */
export class ForbiddenError extends AppError {
  constructor(message: string, code: string = 'forbidden', statusCode: number = 403) {
    super(message, code, statusCode);
  }
}

/**
 * CSRF token validation errors
 */
export class CSRFError extends AppError {
  constructor(message: string, code: string = 'csrf_error', statusCode: number = 403) {
    super(message, code, statusCode);
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends AppError {
  constructor(message: string, code: string = 'rate_limit', statusCode: number = 429) {
    super(message, code, statusCode);
  }
}

/**
 * Server errors
 */
export class ServerError extends AppError {
  constructor(message: string, code: string = 'server_error', statusCode: number = 500) {
    super(message, code, statusCode);
  }
}

/**
 * Database errors
 */
export class DatabaseError extends AppError {
  constructor(message: string, code: string = 'database_error', statusCode: number = 500) {
    super(message, code, statusCode);
  }
}

/**
 * External service errors
 */
export class ExternalServiceError extends AppError {
  constructor(message: string, code: string = 'external_service_error', statusCode: number = 502) {
    super(message, code, statusCode);
  }
} 