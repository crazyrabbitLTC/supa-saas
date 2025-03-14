# Error Handling Utilities Implementation Guide

## Overview

This document provides a detailed implementation guide for refactoring duplicated error handling code (Task 6.2 in the Code Organization Plan). These utility functions will centralize error handling logic, improve consistency, and make error handling more maintainable across the application.

## Step 1: Analyze Current Error Handling Patterns

Before implementing the utility functions, we need to identify common error handling patterns across the application:

1. Authentication errors (invalid credentials, expired tokens, etc.)
2. Validation errors (form validation, input validation)
3. Server errors (database errors, external API errors)
4. CSRF token validation errors
5. Rate limiting errors

## Step 2: Create Custom Error Classes

Create a new file at `apps/web/lib/errors/custom-errors.ts` with the following error classes:

```typescript
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
 * Specific authentication error for invalid credentials
 */
export class InvalidCredentialsError extends AuthError {
  constructor(message: string = 'Invalid email or password') {
    super(message, 'invalid_credentials', 401);
  }
}

/**
 * Specific authentication error for expired sessions
 */
export class SessionExpiredError extends AuthError {
  constructor(message: string = 'Your session has expired, please log in again') {
    super(message, 'session_expired', 401);
  }
}

/**
 * Specific authentication error for missing authentication
 */
export class UnauthenticatedError extends AuthError {
  constructor(message: string = 'Authentication required') {
    super(message, 'unauthenticated', 401);
  }
}

/**
 * Authorization-related errors
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'You do not have permission to access this resource') {
    super(message, 'forbidden', 403);
  }
}

/**
 * Validation-related errors
 */
export class ValidationError extends AppError {
  public fields: Record<string, string>;
  
  constructor(message: string = 'Validation failed', fields: Record<string, string> = {}) {
    super(message, 'validation_error', 400);
    this.fields = fields;
  }
}

/**
 * CSRF token validation errors
 */
export class CSRFError extends AppError {
  constructor(message: string = 'CSRF token validation failed') {
    super(message, 'csrf_error', 403);
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(message, 'rate_limit_exceeded', 429);
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'not_found', 404);
  }
}

/**
 * Server errors
 */
export class ServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 'server_error', 500);
  }
}
```

## Step 3: Create Error Handling Utilities

Create a new file at `apps/web/lib/errors/error-utils.ts` with the following utility functions:

```typescript
/**
 * @file Error Handling Utilities
 * @description Utility functions for handling and formatting errors
 */

import { NextResponse } from 'next/server';
import { 
  AppError, 
  AuthError, 
  ValidationError, 
  ServerError,
  CSRFError,
  RateLimitError,
  NotFoundError,
  ForbiddenError
} from './custom-errors';

/**
 * Check if an error is an instance of AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Check if an error is an authentication error
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Check if an error is a validation error
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Check if an error is a CSRF error
 */
export function isCSRFError(error: unknown): error is CSRFError {
  return error instanceof CSRFError;
}

/**
 * Format an error for client response
 * Ensures sensitive information is not leaked
 */
export function formatErrorResponse(error: unknown) {
  if (isAppError(error)) {
    // For app errors, return the code, message, and any additional data
    const response: Record<string, any> = {
      error: {
        code: error.code,
        message: error.message,
      }
    };
    
    // Add validation fields if it's a validation error
    if (isValidationError(error)) {
      response.error.fields = error.fields;
    }
    
    return response;
  }
  
  // For unknown errors, return a generic server error
  console.error('Unhandled error:', error);
  return {
    error: {
      code: 'server_error',
      message: 'An unexpected error occurred'
    }
  };
}

/**
 * Create a NextResponse with the appropriate error format and status code
 */
export function createErrorResponse(error: unknown) {
  const formattedError = formatErrorResponse(error);
  const statusCode = isAppError(error) ? error.statusCode : 500;
  
  return NextResponse.json(formattedError, { status: statusCode });
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: unknown) {
  if (error instanceof Error) {
    // Convert common authentication errors to our custom format
    if (error.message.includes('invalid credentials')) {
      return new InvalidCredentialsError();
    }
    
    if (error.message.includes('session expired') || error.message.includes('token expired')) {
      return new SessionExpiredError();
    }
    
    // Default to a generic auth error
    return new AuthError(error.message);
  }
  
  // If it's not an Error instance, return a generic auth error
  return new AuthError('Authentication failed');
}

/**
 * Handle validation errors
 */
export function handleValidationError(error: unknown, fields: Record<string, string> = {}) {
  if (error instanceof Error) {
    return new ValidationError(error.message, fields);
  }
  
  return new ValidationError('Validation failed', fields);
}

/**
 * Handle server errors
 */
export function handleServerError(error: unknown) {
  console.error('Server error:', error);
  
  if (error instanceof Error) {
    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'production') {
      return new ServerError();
    }
    
    return new ServerError(error.message);
  }
  
  return new ServerError();
}

/**
 * Create a validation error from form data
 */
export function createValidationError(fields: Record<string, string>) {
  const message = Object.keys(fields).length > 0
    ? 'Please correct the following errors:'
    : 'Validation failed';
    
  return new ValidationError(message, fields);
}

/**
 * Log an error with appropriate context
 */
export function logError(error: unknown, context: Record<string, any> = {}) {
  const errorObject = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    code: isAppError(error) ? error.code : undefined,
    ...context
  };
  
  console.error('Error:', JSON.stringify(errorObject, null, 2));
}
```

## Step 4: Create API Response Formatters

Create a new file at `apps/web/lib/api/response-formatters.ts` with the following utility functions:

```typescript
/**
 * @file API Response Formatters
 * @description Utility functions for formatting API responses
 */

import { NextResponse } from 'next/server';
import { createErrorResponse } from '../errors/error-utils';

/**
 * Create a success response
 */
export function createSuccessResponse<T>(data: T, statusCode: number = 200) {
  return NextResponse.json({ data }, { status: statusCode });
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
) {
  return NextResponse.json({
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  });
}

/**
 * Create an empty success response (204 No Content)
 */
export function createEmptyResponse() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Create a redirect response
 */
export function createRedirectResponse(url: string, statusCode: number = 302) {
  return NextResponse.redirect(url, statusCode);
}

/**
 * Wrap an API handler with error handling
 */
export function withErrorHandling(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error);
    }
  };
}
```

## Step 5: Create Unit Tests

Create a new file at `apps/web/lib/errors/__tests__/error-utils.test.ts` with the following tests:

```typescript
/**
 * @file Error Utilities Tests
 * @description Unit tests for error handling utilities
 */

import { 
  isAppError,
  isAuthError,
  isValidationError,
  formatErrorResponse,
  handleAuthError,
  handleValidationError,
  handleServerError,
  createValidationError
} from '../error-utils';

import {
  AppError,
  AuthError,
  ValidationError,
  ServerError,
  InvalidCredentialsError
} from '../custom-errors';

describe('Error Utilities', () => {
  describe('Error Type Checks', () => {
    it('should correctly identify AppError instances', () => {
      expect(isAppError(new AppError('Test error', 'test_error'))).toBe(true);
      expect(isAppError(new Error('Test error'))).toBe(false);
      expect(isAppError('string error')).toBe(false);
    });
    
    it('should correctly identify AuthError instances', () => {
      expect(isAuthError(new AuthError('Auth error'))).toBe(true);
      expect(isAuthError(new InvalidCredentialsError())).toBe(true);
      expect(isAuthError(new ValidationError('Validation error'))).toBe(false);
    });
    
    it('should correctly identify ValidationError instances', () => {
      expect(isValidationError(new ValidationError('Validation error'))).toBe(true);
      expect(isValidationError(new AuthError('Auth error'))).toBe(false);
    });
  });
  
  describe('Error Formatting', () => {
    it('should format AppError instances correctly', () => {
      const error = new AppError('Test error', 'test_error', 400);
      const formatted = formatErrorResponse(error);
      
      expect(formatted).toEqual({
        error: {
          code: 'test_error',
          message: 'Test error'
        }
      });
    });
    
    it('should include validation fields for ValidationError', () => {
      const error = new ValidationError('Validation error', { 
        email: 'Invalid email',
        password: 'Password too short'
      });
      const formatted = formatErrorResponse(error);
      
      expect(formatted).toEqual({
        error: {
          code: 'validation_error',
          message: 'Validation error',
          fields: {
            email: 'Invalid email',
            password: 'Password too short'
          }
        }
      });
    });
    
    it('should handle unknown errors gracefully', () => {
      const error = new Error('Unknown error');
      const formatted = formatErrorResponse(error);
      
      expect(formatted).toEqual({
        error: {
          code: 'server_error',
          message: 'An unexpected error occurred'
        }
      });
    });
  });
  
  describe('Error Handlers', () => {
    it('should handle authentication errors correctly', () => {
      const error = new Error('invalid credentials');
      const handled = handleAuthError(error);
      
      expect(handled).toBeInstanceOf(InvalidCredentialsError);
      expect(handled.code).toBe('invalid_credentials');
    });
    
    it('should handle validation errors correctly', () => {
      const fields = { email: 'Invalid email' };
      const error = new Error('Validation failed');
      const handled = handleValidationError(error, fields);
      
      expect(handled).toBeInstanceOf(ValidationError);
      expect(handled.fields).toEqual(fields);
    });
    
    it('should handle server errors correctly', () => {
      const error = new Error('Database connection failed');
      const handled = handleServerError(error);
      
      expect(handled).toBeInstanceOf(ServerError);
      
      // In non-production, it should preserve the message
      expect(handled.message).toBe('Database connection failed');
      
      // Mock production environment
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const handledInProduction = handleServerError(error);
      expect(handledInProduction.message).toBe('Internal server error');
      
      // Restore environment
      process.env.NODE_ENV = originalNodeEnv;
    });
  });
  
  describe('Error Creation', () => {
    it('should create validation errors with fields', () => {
      const fields = {
        email: 'Invalid email',
        password: 'Password too short'
      };
      
      const error = createValidationError(fields);
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.fields).toEqual(fields);
      expect(error.message).toBe('Please correct the following errors:');
    });
    
    it('should create validation errors with default message when no fields', () => {
      const error = createValidationError({});
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Validation failed');
    });
  });
});
```

## Step 6: Refactor Existing Code

After implementing the error handling utilities, refactor existing code to use them. Here are some examples:

### Example 1: API Route with Error Handling

```typescript
import { NextRequest } from 'next/server';
import { createSuccessResponse } from '@/lib/api/response-formatters';
import { withErrorHandling } from '@/lib/api/response-formatters';
import { ValidationError, UnauthenticatedError } from '@/lib/errors/custom-errors';
import { getUser } from '@/lib/auth/user';

async function handler(req: NextRequest) {
  const user = await getUser();
  
  if (!user) {
    throw new UnauthenticatedError();
  }
  
  const body = await req.json();
  
  // Validate input
  if (!body.name) {
    throw new ValidationError('Validation failed', {
      name: 'Name is required'
    });
  }
  
  // Process the request
  const result = await processData(body);
  
  return createSuccessResponse(result);
}

// Wrap the handler with error handling
export const POST = withErrorHandling(handler);
```

### Example 2: Client-Side Error Handling

```tsx
import { useState } from 'react';
import { isValidationError } from '@/lib/errors/error-utils';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error.fields) {
          // Handle validation errors
          setErrors(data.error.fields);
        } else {
          // Handle general errors
          setGeneralError(data.error.message);
        }
        return;
      }
      
      // Handle successful login
      window.location.href = '/dashboard';
    } catch (error) {
      setGeneralError('An unexpected error occurred. Please try again.');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {generalError && <div className="error">{generalError}</div>}
      
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <div className="error">{errors.email}</div>}
      </div>
      
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <div className="error">{errors.password}</div>}
      </div>
      
      <button type="submit">Login</button>
    </form>
  );
}
```

## Step 7: Documentation

Add comprehensive documentation for the error handling utilities:

1. Add JSDoc comments to all functions and classes
2. Update the project README to mention the error handling utilities
3. Create a developer guide for using the error handling utilities

## Implementation Checklist

- [ ] Analyze current error handling patterns in the codebase
- [ ] Create custom error classes
- [ ] Implement error handling utility functions
- [ ] Create API response formatters
- [ ] Write unit tests for all functions
- [ ] Refactor existing code to use the utility functions
- [ ] Add comprehensive documentation 