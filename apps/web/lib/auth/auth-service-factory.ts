/**
 * @file Authentication Service Factory
 * @description Factory for creating and accessing the AuthService singleton
 */

import { IAuthService } from '@/lib/di/interfaces/auth-service.interface';
import { AuthService } from './auth-service';

// Singleton instance of the AuthService
let authServiceInstance: IAuthService | null = null;

/**
 * Get the AuthService instance
 * @returns The AuthService singleton instance
 */
export function getAuthService(): IAuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  
  return authServiceInstance;
}

/**
 * Reset the AuthService instance (useful for testing)
 */
export function resetAuthService(): void {
  authServiceInstance = null;
}

/**
 * Set a custom AuthService instance (useful for testing)
 * @param service The custom AuthService instance
 */
export function setAuthService(service: IAuthService): void {
  authServiceInstance = service;
} 