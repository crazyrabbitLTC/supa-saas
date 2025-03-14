/**
 * @file Auth Service Mock
 * @description Mock implementation of the AuthService for testing
 */

import { IAuthService } from '../interfaces/auth-service.interface';
import { User, UserSignupData } from '@/types/auth';

/**
 * Mock implementation of the AuthService for testing
 */
export class MockAuthService implements IAuthService {
  private user: User | null = null;
  private csrfTokens: Map<string, boolean> = new Map();
  
  // Mock methods that can be spied on in tests
  login = jest.fn(async (email: string, password: string): Promise<User> => {
    if (email === 'test@example.com' && password === 'password') {
      this.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['resource-1:read']
      };
      
      return this.user;
    }
    
    throw new Error('Invalid credentials');
  });
  
  logout = jest.fn(async (): Promise<void> => {
    this.user = null;
  });
  
  signup = jest.fn(async (userData: UserSignupData): Promise<User> => {
    if (!userData.email || !userData.password) {
      throw new Error('Email and password are required');
    }
    
    this.user = {
      id: 'new-user-id',
      email: userData.email,
      roles: ['user'],
      permissions: []
    };
    
    return this.user;
  });
  
  resetPassword = jest.fn(async (email: string): Promise<void> => {
    if (!email) {
      throw new Error('Email is required');
    }
    
    // Do nothing in the mock
  });
  
  updatePassword = jest.fn(async (token: string, newPassword: string): Promise<void> => {
    if (!token || !newPassword) {
      throw new Error('Token and new password are required');
    }
    
    if (token !== 'valid-token') {
      throw new Error('Invalid token');
    }
    
    // Do nothing in the mock
  });
  
  getUser = jest.fn(async (): Promise<User | null> => {
    return this.user;
  });
  
  refreshSession = jest.fn(async (): Promise<void> => {
    if (!this.user) {
      throw new Error('No active session');
    }
    
    // Do nothing in the mock
  });
  
  generateCSRFToken = jest.fn((): string => {
    const token = `mock-csrf-token-${Date.now()}`;
    this.csrfTokens.set(token, true);
    return token;
  });
  
  validateCSRFToken = jest.fn((token: string): boolean => {
    const isValid = this.csrfTokens.has(token);
    
    if (isValid) {
      this.csrfTokens.delete(token);
    }
    
    return isValid;
  });
  
  // Helper methods for testing
  
  /**
   * Set the current user for testing
   * @param user The user to set
   */
  setUser(user: User | null): void {
    this.user = user;
  }
  
  /**
   * Add a valid CSRF token for testing
   * @param token The token to add
   */
  addCSRFToken(token: string): void {
    this.csrfTokens.set(token, true);
  }
} 