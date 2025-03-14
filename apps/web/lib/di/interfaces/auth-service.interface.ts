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
   * Send a password reset email
   * @param email User's email
   * @returns Promise resolving when the reset email is sent
   */
  resetPassword(email: string): Promise<void>;
  
  /**
   * Update a user's password using a reset token
   * @param token Password reset token
   * @param newPassword New password
   * @returns Promise resolving when the password is updated
   * @throws AuthError if the token is invalid
   */
  updatePassword(token: string, newPassword: string): Promise<void>;
  
  /**
   * Get the current authenticated user
   * @returns Promise resolving to the current user or null if not authenticated
   */
  getUser(): Promise<User | null>;
  
  /**
   * Refresh the user's session
   * @returns Promise resolving when the session is refreshed
   * @throws AuthError if the session cannot be refreshed
   */
  refreshSession(): Promise<void>;
  
  /**
   * Generate a CSRF token
   * @returns A new CSRF token
   */
  generateCSRFToken(): string;
  
  /**
   * Validate a CSRF token
   * @param token The token to validate
   * @returns True if the token is valid, false otherwise
   */
  validateCSRFToken(token: string): boolean;
} 