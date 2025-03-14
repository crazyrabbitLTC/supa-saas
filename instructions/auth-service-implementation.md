# Authentication Service Implementation Guide

## Overview

This document provides a detailed implementation guide for centralizing authentication logic in a dedicated service (Task 6.3 in the Code Organization Plan). The AuthService will encapsulate all authentication-related functionality, making it easier to maintain, test, and extend the authentication system.

## Step 1: Analyze Current Authentication Logic

Before implementing the AuthService, we need to identify all authentication-related functionality across the application:

1. User login and session management
2. User registration
3. Password reset and update
4. Session refresh
5. CSRF token generation and validation
6. User retrieval and profile management

## Step 2: Define AuthService Interfaces

Create a new file at `apps/web/lib/di/interfaces/auth-service.interface.ts` with the following interface definitions:

```typescript
/**
 * @file Authentication Service Interface
 * @description Defines the interface for the authentication service
 */

import { User, UserSignupData } from '@/types/auth';

/**
 * Interface for the authentication service
 */
export interface IAuthService {
  /**
   * Authenticate a user with email and password
   * @param email User's email
   * @param password User's password
   * @returns Promise resolving to the authenticated user
   * @throws AuthError if authentication fails
   */
  login(email: string, password: string): Promise<User>;
  
  /**
   * Log out the current user
   * @returns Promise resolving when logout is complete
   */
  logout(): Promise<void>;
  
  /**
   * Register a new user
   * @param userData User registration data
   * @returns Promise resolving to the newly created user
   * @throws ValidationError if registration data is invalid
   */
  signup(userData: UserSignupData): Promise<User>;
  
  /**
   * Initiate a password reset for a user
   * @param email User's email
   * @returns Promise resolving when reset email is sent
   */
  resetPassword(email: string): Promise<void>;
  
  /**
   * Update a user's password using a reset token
   * @param token Password reset token
   * @param newPassword New password
   * @returns Promise resolving when password is updated
   * @throws AuthError if token is invalid
   */
  updatePassword(token: string, newPassword: string): Promise<void>;
  
  /**
   * Get the current authenticated user
   * @returns Promise resolving to the user or null if not authenticated
   */
  getUser(): Promise<User | null>;
  
  /**
   * Refresh the current user session
   * @returns Promise resolving when session is refreshed
   * @throws AuthError if session cannot be refreshed
   */
  refreshSession(): Promise<void>;
  
  /**
   * Generate a CSRF token
   * @returns The generated CSRF token
   */
  generateCSRFToken(): string;
  
  /**
   * Validate a CSRF token
   * @param token The token to validate
   * @returns True if the token is valid, false otherwise
   */
  validateCSRFToken(token: string): boolean;
}
```

## Step 3: Create User Types

Update the `apps/web/types/auth.ts` file to include all necessary types for the AuthService:

```typescript
/**
 * @file Auth Types
 * @description Type definitions for authentication and permissions
 */

export interface User {
  id: string;
  email: string;
  roles?: string[];
  permissions?: string[];
  name?: string;
  createdAt?: string;
  updatedAt?: string;
  // Add other user properties as needed
}

export type ResourceAction = 'read' | 'write' | 'delete';

export interface Permission {
  resourceId: string;
  action: ResourceAction;
}

export interface UserSignupData {
  email: string;
  password: string;
  name?: string;
  // Add other signup fields as needed
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
}

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
  csrfToken?: string;
}
```

## Step 4: Implement the AuthService

Create a new file at `apps/web/lib/auth/auth-service.ts` with the following implementation:

```typescript
/**
 * @file Authentication Service
 * @description Centralized service for handling authentication-related functionality
 * @version 1.0.0
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { randomBytes, createHash } from 'crypto';
import { 
  User, 
  UserSignupData, 
  LoginCredentials, 
  PasswordResetData 
} from '@/types/auth';
import { IAuthService } from '@/lib/di/interfaces/auth-service.interface';
import { 
  AuthError, 
  InvalidCredentialsError, 
  SessionExpiredError,
  ValidationError,
  CSRFError
} from '@/lib/errors/custom-errors';
import { logError } from '@/lib/errors/error-utils';

/**
 * Implementation of the authentication service
 */
export class AuthService implements IAuthService {
  private supabase;
  private csrfTokens: Map<string, { token: string, expires: number }> = new Map();
  
  constructor() {
    this.supabase = createClientComponentClient();
  }
  
  /**
   * Authenticate a user with email and password
   */
  public async login(email: string, password: string): Promise<User> {
    try {
      // Validate input
      if (!email || !password) {
        throw new ValidationError('Email and password are required', {
          email: !email ? 'Email is required' : '',
          password: !password ? 'Password is required' : ''
        });
      }
      
      // Attempt to sign in
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw new InvalidCredentialsError();
      }
      
      if (!data.user) {
        throw new AuthError('Authentication failed');
      }
      
      // Generate a new CSRF token after login
      const csrfToken = this.generateCSRFToken();
      this.storeCSRFToken(csrfToken);
      
      // Map Supabase user to our User type
      return this.mapSupabaseUser(data.user);
    } catch (error) {
      logError(error, { method: 'login', email });
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError('Authentication failed');
    }
  }
  
  /**
   * Log out the current user
   */
  public async logout(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        throw new AuthError('Logout failed');
      }
      
      // Clear CSRF tokens
      this.csrfTokens.clear();
    } catch (error) {
      logError(error, { method: 'logout' });
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError('Logout failed');
    }
  }
  
  /**
   * Register a new user
   */
  public async signup(userData: UserSignupData): Promise<User> {
    try {
      // Validate input
      if (!userData.email || !userData.password) {
        throw new ValidationError('Email and password are required', {
          email: !userData.email ? 'Email is required' : '',
          password: !userData.password ? 'Password is required' : ''
        });
      }
      
      // Attempt to sign up
      const { data, error } = await this.supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name
          }
        }
      });
      
      if (error) {
        throw new ValidationError('Registration failed', {
          email: error.message.includes('email') ? error.message : ''
        });
      }
      
      if (!data.user) {
        throw new AuthError('Registration failed');
      }
      
      // Generate a new CSRF token after signup
      const csrfToken = this.generateCSRFToken();
      this.storeCSRFToken(csrfToken);
      
      // Map Supabase user to our User type
      return this.mapSupabaseUser(data.user);
    } catch (error) {
      logError(error, { method: 'signup', email: userData.email });
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError('Registration failed');
    }
  }
  
  /**
   * Initiate a password reset for a user
   */
  public async resetPassword(email: string): Promise<void> {
    try {
      // Validate input
      if (!email) {
        throw new ValidationError('Email is required', {
          email: 'Email is required'
        });
      }
      
      // Send password reset email
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        throw new AuthError('Password reset failed');
      }
    } catch (error) {
      logError(error, { method: 'resetPassword', email });
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError('Password reset failed');
    }
  }
  
  /**
   * Update a user's password using a reset token
   */
  public async updatePassword(token: string, newPassword: string): Promise<void> {
    try {
      // Validate input
      if (!token || !newPassword) {
        throw new ValidationError('Token and new password are required', {
          password: !newPassword ? 'New password is required' : ''
        });
      }
      
      // Update password
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw new AuthError('Password update failed');
      }
    } catch (error) {
      logError(error, { method: 'updatePassword' });
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new AuthError('Password update failed');
    }
  }
  
  /**
   * Get the current authenticated user
   */
  public async getUser(): Promise<User | null> {
    try {
      const { data, error } = await this.supabase.auth.getUser();
      
      if (error || !data.user) {
        return null;
      }
      
      return this.mapSupabaseUser(data.user);
    } catch (error) {
      logError(error, { method: 'getUser' });
      return null;
    }
  }
  
  /**
   * Refresh the current user session
   */
  public async refreshSession(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.refreshSession();
      
      if (error) {
        throw new SessionExpiredError();
      }
      
      // Generate a new CSRF token after session refresh
      const csrfToken = this.generateCSRFToken();
      this.storeCSRFToken(csrfToken);
    } catch (error) {
      logError(error, { method: 'refreshSession' });
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      throw new SessionExpiredError();
    }
  }
  
  /**
   * Generate a CSRF token
   */
  public generateCSRFToken(): string {
    // Generate a random token
    const token = randomBytes(32).toString('hex');
    
    // Hash the token for storage
    const hashedToken = this.hashToken(token);
    
    return token;
  }
  
  /**
   * Validate a CSRF token
   */
  public validateCSRFToken(token: string): boolean {
    if (!token) {
      return false;
    }
    
    // Hash the provided token
    const hashedToken = this.hashToken(token);
    
    // Check if the token exists and is not expired
    const storedToken = this.csrfTokens.get(hashedToken);
    
    if (!storedToken) {
      return false;
    }
    
    if (storedToken.expires < Date.now()) {
      // Token is expired, remove it
      this.csrfTokens.delete(hashedToken);
      return false;
    }
    
    return true;
  }
  
  /**
   * Store a CSRF token
   * @private
   */
  private storeCSRFToken(token: string): void {
    // Hash the token for storage
    const hashedToken = this.hashToken(token);
    
    // Store the token with an expiration time (e.g., 1 hour)
    this.csrfTokens.set(hashedToken, {
      token: hashedToken,
      expires: Date.now() + 3600000 // 1 hour
    });
    
    // Store the token in a cookie
    this.storeTokenInCookie('csrf-token', token);
  }
  
  /**
   * Store a token in a cookie
   * @private
   */
  private storeTokenInCookie(name: string, token: string): void {
    try {
      const cookieStore = cookies();
      
      cookieStore.set({
        name: `__Host-${name}`,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 3600 // 1 hour
      });
    } catch (error) {
      logError(error, { method: 'storeTokenInCookie', name });
    }
  }
  
  /**
   * Hash a token for secure storage
   * @private
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
  
  /**
   * Map a Supabase user to our User type
   * @private
   */
  private mapSupabaseUser(supabaseUser: any): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.name,
      roles: supabaseUser.user_metadata?.roles || [],
      permissions: supabaseUser.user_metadata?.permissions || [],
      createdAt: supabaseUser.created_at,
      updatedAt: supabaseUser.updated_at
    };
  }
}
```

## Step 5: Create a Factory for the AuthService

Create a new file at `apps/web/lib/auth/auth-service-factory.ts` to provide a singleton instance of the AuthService:

```typescript
/**
 * @file Authentication Service Factory
 * @description Factory for creating and accessing the AuthService
 */

import { AuthService } from './auth-service';
import { IAuthService } from '@/lib/di/interfaces/auth-service.interface';

// Singleton instance
let authServiceInstance: IAuthService | null = null;

/**
 * Get the AuthService instance
 * @returns The AuthService instance
 */
export function getAuthService(): IAuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  
  return authServiceInstance;
}

/**
 * Set the AuthService instance (useful for testing)
 * @param service The AuthService instance to set
 */
export function setAuthService(service: IAuthService): void {
  authServiceInstance = service;
}
```

## Step 6: Create a React Hook for Using the AuthService

Create a new file at `apps/web/hooks/useAuth.ts` to provide a React hook for using the AuthService:

```typescript
/**
 * @file useAuth Hook
 * @description React hook for using the AuthService
 */

import { useState, useEffect, useCallback } from 'react';
import { User, UserSignupData } from '@/types/auth';
import { getAuthService } from '@/lib/auth/auth-service-factory';
import { AuthError } from '@/lib/errors/custom-errors';

/**
 * Hook for using the AuthService
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  const authService = getAuthService();
  
  // Load the user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const currentUser = await authService.getUser();
        setUser(currentUser);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load user'));
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const loggedInUser = await authService.login(email, password);
      setUser(loggedInUser);
      setError(null);
      return loggedInUser;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Login failed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Logout failed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Signup function
  const signup = useCallback(async (userData: UserSignupData) => {
    try {
      setLoading(true);
      const newUser = await authService.signup(userData);
      setUser(newUser);
      setError(null);
      return newUser;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Signup failed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Reset password function
  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      await authService.resetPassword(email);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Password reset failed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Update password function
  const updatePassword = useCallback(async (token: string, newPassword: string) => {
    try {
      setLoading(true);
      await authService.updatePassword(token, newPassword);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Password update failed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Refresh session function
  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      await authService.refreshSession();
      const refreshedUser = await authService.getUser();
      setUser(refreshedUser);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Session refresh failed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    user,
    loading,
    error,
    login,
    logout,
    signup,
    resetPassword,
    updatePassword,
    refreshSession,
    isAuthenticated: !!user
  };
}
```

## Step 7: Create Unit Tests for the AuthService

Create a new file at `apps/web/lib/auth/__tests__/auth-service.test.ts` with the following tests:

```typescript
/**
 * @file AuthService Tests
 * @description Unit tests for the AuthService
 */

import { AuthService } from '../auth-service';
import { 
  AuthError, 
  InvalidCredentialsError, 
  ValidationError 
} from '@/lib/errors/custom-errors';

// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      getUser: jest.fn(),
      refreshSession: jest.fn()
    }
  }))
}));

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    set: jest.fn()
  }))
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockSupabase: any;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a new instance for each test
    authService = new AuthService();
    
    // Get the mocked Supabase client
    mockSupabase = (authService as any).supabase;
  });
  
  describe('login', () => {
    it('should successfully login a user with valid credentials', async () => {
      // Mock successful login
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-id',
            email: 'test@example.com',
            user_metadata: {
              name: 'Test User',
              roles: ['user']
            },
            created_at: '2023-01-01',
            updated_at: '2023-01-01'
          }
        },
        error: null
      });
      
      const user = await authService.login('test@example.com', 'password');
      
      expect(user).toEqual({
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['user'],
        permissions: [],
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01'
      });
      
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });
    
    it('should throw ValidationError if email or password is missing', async () => {
      await expect(authService.login('', 'password')).rejects.toThrow(ValidationError);
      await expect(authService.login('test@example.com', '')).rejects.toThrow(ValidationError);
    });
    
    it('should throw InvalidCredentialsError if login fails', async () => {
      // Mock failed login
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' }
      });
      
      await expect(authService.login('test@example.com', 'wrong-password')).rejects.toThrow(InvalidCredentialsError);
    });
  });
  
  describe('logout', () => {
    it('should successfully log out a user', async () => {
      // Mock successful logout
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      });
      
      await expect(authService.logout()).resolves.not.toThrow();
      
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
    
    it('should throw AuthError if logout fails', async () => {
      // Mock failed logout
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed' }
      });
      
      await expect(authService.logout()).rejects.toThrow(AuthError);
    });
  });
  
  describe('generateCSRFToken', () => {
    it('should generate a CSRF token', () => {
      const token = authService.generateCSRFToken();
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
    
    it('should generate different tokens on each call', () => {
      const token1 = authService.generateCSRFToken();
      const token2 = authService.generateCSRFToken();
      
      expect(token1).not.toEqual(token2);
    });
  });
  
  describe('validateCSRFToken', () => {
    it('should return false for an empty token', () => {
      expect(authService.validateCSRFToken('')).toBe(false);
    });
    
    it('should return false for an invalid token', () => {
      expect(authService.validateCSRFToken('invalid-token')).toBe(false);
    });
    
    it('should return true for a valid token', () => {
      // Generate and store a token
      const token = authService.generateCSRFToken();
      (authService as any).storeCSRFToken(token);
      
      expect(authService.validateCSRFToken(token)).toBe(true);
    });
  });
});
```

## Step 8: Refactor Existing Code to Use the AuthService

After implementing the AuthService, refactor existing code to use it. Here are some examples:

### Example 1: Login Page

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isValidationError } from '@/lib/errors/error-utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  
  const { login, loading } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    
    try {
      await login(email, password);
      window.location.href = '/dashboard';
    } catch (error) {
      if (isValidationError(error)) {
        setErrors(error.fields);
      } else {
        setGeneralError(error instanceof Error ? error.message : 'Login failed');
      }
    }
  };
  
  return (
    <div className="login-page">
      <h1>Login</h1>
      
      <form onSubmit={handleSubmit}>
        {generalError && <div className="error">{generalError}</div>}
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          {errors.email && <div className="error">{errors.email}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {errors.password && <div className="error">{errors.password}</div>}
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

### Example 2: Protected API Route

```typescript
import { NextRequest } from 'next/server';
import { createSuccessResponse } from '@/lib/api/response-formatters';
import { withErrorHandling } from '@/lib/api/response-formatters';
import { UnauthenticatedError } from '@/lib/errors/custom-errors';
import { getAuthService } from '@/lib/auth/auth-service-factory';

async function handler(req: NextRequest) {
  const authService = getAuthService();
  const user = await authService.getUser();
  
  if (!user) {
    throw new UnauthenticatedError();
  }
  
  // Process the request
  const data = { message: 'Protected data', user: { id: user.id, email: user.email } };
  
  return createSuccessResponse(data);
}

// Wrap the handler with error handling
export const GET = withErrorHandling(handler);
```

## Step 9: Documentation

Add comprehensive documentation for the AuthService:

1. Add JSDoc comments to all methods and classes
2. Update the project README to mention the AuthService
3. Create a developer guide for using the AuthService

## Implementation Checklist

- [ ] Analyze current authentication logic in the codebase
- [ ] Define the AuthService interface
- [ ] Create or update user and authentication types
- [ ] Implement the AuthService class
- [ ] Create a factory for the AuthService
- [ ] Create a React hook for using the AuthService
- [ ] Write unit tests for the AuthService
- [ ] Refactor existing code to use the AuthService
- [ ] Add comprehensive documentation 