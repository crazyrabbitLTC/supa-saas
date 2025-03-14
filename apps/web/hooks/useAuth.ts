/**
 * @file useAuth Hook
 * @description Custom hook for authentication using the DI container
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useService } from '@/lib/di/provider';
import { AUTH_SERVICE } from '@/lib/di/tokens';
import { IAuthService } from '@/lib/di/interfaces/auth-service.interface';
import { User, UserSignupData } from '@/types/auth';
import { AuthError, ValidationError } from '@/lib/errors/custom-errors';

/**
 * Return type for the useAuth hook
 */
interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (userData: UserSignupData) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (token: string, newPassword: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for authentication
 * @returns Authentication state and methods
 */
export function useAuth(): UseAuthReturn {
  const authService = useService<IAuthService>(AUTH_SERVICE);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Load the user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        const currentUser = await authService.getUser();
        setUser(currentUser);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load user'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, [authService]);
  
  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const loggedInUser = await authService.login(email, password);
      setUser(loggedInUser);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Login failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);
  
  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.logout();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Logout failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);
  
  // Signup function
  const signup = useCallback(async (userData: UserSignupData) => {
    try {
      setIsLoading(true);
      setError(null);
      const newUser = await authService.signup(userData);
      setUser(newUser);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Signup failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);
  
  // Reset password function
  const resetPassword = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.resetPassword(email);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Password reset failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);
  
  // Update password function
  const updatePassword = useCallback(async (token: string, newPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.updatePassword(token, newPassword);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Password update failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);
  
  // Refresh session function
  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.refreshSession();
      const currentUser = await authService.getUser();
      setUser(currentUser);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Session refresh failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authService]);
  
  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    user,
    isLoading,
    error,
    login,
    logout,
    signup,
    resetPassword,
    updatePassword,
    refreshSession,
    clearError
  };
} 