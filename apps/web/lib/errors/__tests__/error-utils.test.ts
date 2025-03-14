/**
 * @file Error Utilities Tests
 * @description Unit tests for error handling utility functions
 */

import { NextResponse } from 'next/server';
import { 
  isAppError,
  isAuthError,
  isValidationError,
  formatErrorResponse,
  createErrorResponse,
  handleAuthError,
  handleValidationError,
  handleServerError,
  withErrorHandling
} from '../error-utils';
import {
  AppError,
  AuthError,
  ValidationError,
  ServerError
} from '../custom-errors';

// Mock NextResponse.json
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((body, init) => ({
      body,
      init
    }))
  }
}));

describe('Error Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Error Type Checks', () => {
    it('should correctly identify AppError', () => {
      const error = new AppError('Test error', 'test_error', 500);
      expect(isAppError(error)).toBe(true);
      expect(isAppError(new Error('Not an AppError'))).toBe(false);
    });

    it('should correctly identify AuthError', () => {
      const error = new AuthError('Auth error');
      expect(isAuthError(error)).toBe(true);
      expect(isAuthError(new Error('Not an AuthError'))).toBe(false);
    });

    it('should correctly identify ValidationError', () => {
      const error = new ValidationError('Validation error');
      expect(isValidationError(error)).toBe(true);
      expect(isValidationError(new Error('Not a ValidationError'))).toBe(false);
    });
  });

  describe('formatErrorResponse', () => {
    it('should format AppError correctly', () => {
      const error = new AppError('Test error', 'test_error', 500);
      const response = formatErrorResponse(error);
      
      expect(response).toEqual({
        error: {
          message: 'Test error',
          code: 'test_error',
          statusCode: 500
        }
      });
    });

    it('should format ValidationError with fields', () => {
      const error = new ValidationError(
        'Validation error', 
        { email: 'Invalid email' }
      );
      
      const response = formatErrorResponse(error);
      
      expect(response).toEqual({
        error: {
          message: 'Validation error',
          code: 'validation_error',
          statusCode: 400,
          fields: { email: 'Invalid email' }
        }
      });
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');
      const response = formatErrorResponse(error);
      
      expect(response).toEqual({
        error: {
          message: 'Unknown error',
          code: 'unknown_error',
          statusCode: 500
        }
      });
    });

    it('should handle non-Error objects', () => {
      const response = formatErrorResponse('Not an error');
      
      expect(response).toEqual({
        error: {
          message: 'Unknown error',
          code: 'unknown_error',
          statusCode: 500
        }
      });
    });
  });

  describe('createErrorResponse', () => {
    it('should create NextResponse with correct status code', () => {
      const error = new AuthError('Auth error');
      createErrorResponse(error);
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: {
            message: 'Auth error',
            code: 'auth_error',
            statusCode: 401
          }
        },
        { status: 401 }
      );
    });
  });

  describe('Error Handlers', () => {
    describe('handleAuthError', () => {
      it('should handle AuthError', () => {
        const error = new AuthError('Invalid credentials');
        const result = handleAuthError(error);
        
        expect(result).toEqual({
          message: 'Invalid credentials',
          code: 'auth_error'
        });
      });

      it('should handle non-AuthError', () => {
        const error = new Error('Some error');
        const result = handleAuthError(error);
        
        expect(result).toEqual({
          message: 'Authentication failed',
          code: 'auth_error'
        });
      });
    });

    describe('handleValidationError', () => {
      it('should handle ValidationError with fields', () => {
        const error = new ValidationError(
          'Invalid input', 
          { email: 'Invalid email', password: 'Too short' }
        );
        
        const result = handleValidationError(error);
        
        expect(result).toEqual({
          message: 'Invalid input',
          fields: { email: 'Invalid email', password: 'Too short' },
          code: 'validation_error'
        });
      });

      it('should handle non-ValidationError', () => {
        const error = new Error('Some error');
        const result = handleValidationError(error);
        
        expect(result).toEqual({
          message: 'Validation failed',
          fields: {},
          code: 'validation_error'
        });
      });
    });

    describe('handleServerError', () => {
      it('should handle AppError', () => {
        const error = new ServerError('Database connection failed');
        const result = handleServerError(error);
        
        expect(result).toEqual({
          message: 'Database connection failed',
          code: 'server_error'
        });
      });

      it('should handle non-AppError', () => {
        const error = new Error('Some error');
        const result = handleServerError(error);
        
        expect(result).toEqual({
          message: 'An unexpected error occurred',
          code: 'server_error'
        });
      });
    });
  });

  describe('withErrorHandling', () => {
    it('should pass through successful responses', async () => {
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      );
      
      const wrappedHandler = withErrorHandling(mockHandler);
      const req = { nextUrl: { pathname: '/api/test' } };
      
      await wrappedHandler(req);
      
      expect(mockHandler).toHaveBeenCalledWith(req);
    });

    it('should catch and format errors', async () => {
      const error = new AuthError('Unauthorized');
      const mockHandler = jest.fn().mockRejectedValue(error);
      
      const wrappedHandler = withErrorHandling(mockHandler);
      const req = { nextUrl: { pathname: '/api/test' } };
      
      await wrappedHandler(req);
      
      expect(NextResponse.json).toHaveBeenCalledWith(
        {
          error: {
            message: 'Unauthorized',
            code: 'auth_error',
            statusCode: 401
          }
        },
        { status: 401 }
      );
    });
  });
}); 