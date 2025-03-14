# Dependency Injection Implementation Guide

## Overview

This document provides a detailed implementation guide for creating a simple dependency injection (DI) container (Task 6.4 in the Code Organization Plan). The DI container will improve testability by making it easier to mock dependencies and will help decouple components from their dependencies.

## Step 1: Understand the Need for Dependency Injection

Before implementing the DI container, it's important to understand why we need it:

1. **Testability**: Makes it easier to replace real implementations with mocks during testing
2. **Decoupling**: Reduces direct dependencies between components
3. **Configurability**: Allows for different implementations in different environments
4. **Maintainability**: Makes the codebase more modular and easier to maintain

## Step 2: Define the DI Container Interface

Create a new file at `apps/web/lib/di/interfaces/container.interface.ts` with the following interface definitions:

```typescript
/**
 * @file DI Container Interface
 * @description Defines the interface for the dependency injection container
 */

/**
 * Interface for the dependency injection container
 */
export interface IDIContainer {
  /**
   * Register a service with the container
   * @param token The token to register the service under
   * @param factory A factory function that creates the service
   */
  register<T>(token: symbol, factory: () => T): void;
  
  /**
   * Register a singleton service with the container
   * @param token The token to register the service under
   * @param factory A factory function that creates the service
   */
  registerSingleton<T>(token: symbol, factory: () => T): void;
  
  /**
   * Get a service from the container
   * @param token The token to get the service for
   * @returns The service instance
   * @throws Error if the service is not registered
   */
  get<T>(token: symbol): T;
  
  /**
   * Check if a service is registered with the container
   * @param token The token to check
   * @returns True if the service is registered, false otherwise
   */
  has(token: symbol): boolean;
  
  /**
   * Reset the container, removing all registered services
   * Primarily used for testing
   */
  reset(): void;
}
```

## Step 3: Create Service Tokens

Create a new file at `apps/web/lib/di/tokens.ts` to define tokens for all services:

```typescript
/**
 * @file Service Tokens
 * @description Defines tokens for all services in the application
 */

/**
 * Token for the authentication service
 */
export const AUTH_SERVICE = Symbol('AUTH_SERVICE');

/**
 * Token for the user service
 */
export const USER_SERVICE = Symbol('USER_SERVICE');

/**
 * Token for the CSRF service
 */
export const CSRF_SERVICE = Symbol('CSRF_SERVICE');

/**
 * Token for the logger service
 */
export const LOGGER_SERVICE = Symbol('LOGGER_SERVICE');

// Add more service tokens as needed
```

## Step 4: Implement the DI Container

Create a new file at `apps/web/lib/di/container.ts` with the following implementation:

```typescript
/**
 * @file DI Container
 * @description Simple dependency injection container implementation
 */

import { IDIContainer } from './interfaces/container.interface';

/**
 * Simple dependency injection container
 */
export class DIContainer implements IDIContainer {
  private factories: Map<symbol, () => any> = new Map();
  private singletons: Map<symbol, any> = new Map();
  
  /**
   * Register a service with the container
   */
  public register<T>(token: symbol, factory: () => T): void {
    this.factories.set(token, factory);
    this.singletons.delete(token); // Remove any existing singleton
  }
  
  /**
   * Register a singleton service with the container
   */
  public registerSingleton<T>(token: symbol, factory: () => T): void {
    this.factories.set(token, factory);
    this.singletons.delete(token); // Remove any existing singleton
  }
  
  /**
   * Get a service from the container
   */
  public get<T>(token: symbol): T {
    // Check if the service is registered
    if (!this.has(token)) {
      throw new Error(`Service not registered: ${token.toString()}`);
    }
    
    // Check if we have a singleton instance
    if (this.singletons.has(token)) {
      return this.singletons.get(token);
    }
    
    // Get the factory
    const factory = this.factories.get(token)!;
    
    // Create a new instance
    const instance = factory();
    
    // Store as singleton if it was registered as a singleton
    this.singletons.set(token, instance);
    
    return instance;
  }
  
  /**
   * Check if a service is registered with the container
   */
  public has(token: symbol): boolean {
    return this.factories.has(token);
  }
  
  /**
   * Reset the container
   */
  public reset(): void {
    this.factories.clear();
    this.singletons.clear();
  }
}

// Create a singleton instance of the container
const container = new DIContainer();

/**
 * Get the DI container instance
 */
export function getContainer(): IDIContainer {
  return container;
}
```

## Step 5: Create a Provider for React Components

Create a new file at `apps/web/lib/di/provider.tsx` to provide the DI container to React components:

```typescript
/**
 * @file DI Provider
 * @description Provides the DI container to React components
 */

'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { IDIContainer } from './interfaces/container.interface';
import { getContainer } from './container';

// Create a context for the DI container
const DIContext = createContext<IDIContainer | null>(null);

/**
 * Props for the DIProvider component
 */
interface DIProviderProps {
  container?: IDIContainer;
  children: ReactNode;
}

/**
 * Provider component for the DI container
 */
export function DIProvider({ container = getContainer(), children }: DIProviderProps) {
  return (
    <DIContext.Provider value={container}>
      {children}
    </DIContext.Provider>
  );
}

/**
 * Hook for using the DI container
 * @returns The DI container
 * @throws Error if used outside of a DIProvider
 */
export function useDI(): IDIContainer {
  const container = useContext(DIContext);
  
  if (!container) {
    throw new Error('useDI must be used within a DIProvider');
  }
  
  return container;
}

/**
 * Hook for getting a service from the DI container
 * @param token The token for the service
 * @returns The service instance
 */
export function useService<T>(token: symbol): T {
  const container = useDI();
  return container.get<T>(token);
}
```

## Step 6: Register Services with the Container

Create a new file at `apps/web/lib/di/register-services.ts` to register all services with the container:

```typescript
/**
 * @file Register Services
 * @description Registers all services with the DI container
 */

import { getContainer } from './container';
import { 
  AUTH_SERVICE, 
  USER_SERVICE, 
  CSRF_SERVICE, 
  LOGGER_SERVICE 
} from './tokens';
import { AuthService } from '@/lib/auth/auth-service';
import { IAuthService } from './interfaces/auth-service.interface';

/**
 * Register all services with the DI container
 */
export function registerServices(): void {
  const container = getContainer();
  
  // Register the AuthService
  container.registerSingleton<IAuthService>(AUTH_SERVICE, () => new AuthService());
  
  // Register other services as needed
  // container.registerSingleton<IUserService>(USER_SERVICE, () => new UserService());
  // container.registerSingleton<ICSRFService>(CSRF_SERVICE, () => new CSRFService());
  // container.registerSingleton<ILoggerService>(LOGGER_SERVICE, () => new LoggerService());
}
```

## Step 7: Initialize the DI Container in the Application

Update the `apps/web/app/layout.tsx` file to initialize the DI container:

```tsx
import { DIProvider } from '@/lib/di/provider';
import { registerServices } from '@/lib/di/register-services';

// Register all services
registerServices();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <DIProvider>
          {children}
        </DIProvider>
      </body>
    </html>
  );
}
```

## Step 8: Update the AuthService to Use the DI Container

Update the `apps/web/hooks/useAuth.ts` file to use the DI container:

```typescript
/**
 * @file useAuth Hook
 * @description React hook for using the AuthService
 */

import { useState, useEffect, useCallback } from 'react';
import { User, UserSignupData } from '@/types/auth';
import { useService } from '@/lib/di/provider';
import { AUTH_SERVICE } from '@/lib/di/tokens';
import { IAuthService } from '@/lib/di/interfaces/auth-service.interface';
import { AuthError } from '@/lib/errors/custom-errors';

/**
 * Hook for using the AuthService
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Get the AuthService from the DI container
  const authService = useService<IAuthService>(AUTH_SERVICE);
  
  // Rest of the hook implementation remains the same
  // ...
}
```

## Step 9: Create Mock Services for Testing

Create a new file at `apps/web/lib/di/mocks/auth-service.mock.ts` to provide a mock implementation of the AuthService for testing:

```typescript
/**
 * @file Mock AuthService
 * @description Mock implementation of the AuthService for testing
 */

import { IAuthService } from '@/lib/di/interfaces/auth-service.interface';
import { User, UserSignupData } from '@/types/auth';

/**
 * Mock implementation of the AuthService for testing
 */
export class MockAuthService implements IAuthService {
  private user: User | null = null;
  private csrfToken: string = 'mock-csrf-token';
  
  // Mock user data for testing
  private mockUser: User = {
    id: 'mock-user-id',
    email: 'mock@example.com',
    name: 'Mock User',
    roles: ['user'],
    permissions: []
  };
  
  /**
   * Set the mock user
   */
  public setMockUser(user: User | null): void {
    this.user = user;
  }
  
  /**
   * Mock login implementation
   */
  public async login(email: string, password: string): Promise<User> {
    // Simulate successful login
    this.user = this.mockUser;
    return this.mockUser;
  }
  
  /**
   * Mock logout implementation
   */
  public async logout(): Promise<void> {
    this.user = null;
  }
  
  /**
   * Mock signup implementation
   */
  public async signup(userData: UserSignupData): Promise<User> {
    // Simulate successful signup
    this.user = {
      ...this.mockUser,
      email: userData.email,
      name: userData.name || 'Mock User'
    };
    
    return this.user;
  }
  
  /**
   * Mock resetPassword implementation
   */
  public async resetPassword(email: string): Promise<void> {
    // Do nothing
  }
  
  /**
   * Mock updatePassword implementation
   */
  public async updatePassword(token: string, newPassword: string): Promise<void> {
    // Do nothing
  }
  
  /**
   * Mock getUser implementation
   */
  public async getUser(): Promise<User | null> {
    return this.user;
  }
  
  /**
   * Mock refreshSession implementation
   */
  public async refreshSession(): Promise<void> {
    // Do nothing
  }
  
  /**
   * Mock generateCSRFToken implementation
   */
  public generateCSRFToken(): string {
    return this.csrfToken;
  }
  
  /**
   * Mock validateCSRFToken implementation
   */
  public validateCSRFToken(token: string): boolean {
    return token === this.csrfToken;
  }
}
```

## Step 10: Create a Test Setup Utility

Create a new file at `apps/web/lib/di/test-utils.ts` to provide utilities for testing with the DI container:

```typescript
/**
 * @file Test Utilities
 * @description Utilities for testing with the DI container
 */

import { DIContainer } from './container';
import { AUTH_SERVICE } from './tokens';
import { MockAuthService } from './mocks/auth-service.mock';
import { IAuthService } from './interfaces/auth-service.interface';

/**
 * Create a test container with mock services
 * @returns A DI container with mock services
 */
export function createTestContainer(): DIContainer {
  const container = new DIContainer();
  
  // Register mock services
  container.registerSingleton<IAuthService>(AUTH_SERVICE, () => new MockAuthService());
  
  // Register other mock services as needed
  
  return container;
}

/**
 * Get the mock AuthService from a test container
 * @param container The test container
 * @returns The mock AuthService
 */
export function getMockAuthService(container: DIContainer): MockAuthService {
  return container.get<IAuthService>(AUTH_SERVICE) as MockAuthService;
}

// Add more helper functions for other mock services as needed
```

## Step 11: Write Tests Using the DI Container

Create a new file at `apps/web/hooks/__tests__/useAuth.test.tsx` to test the useAuth hook with the DI container:

```tsx
/**
 * @file useAuth Tests
 * @description Tests for the useAuth hook
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { DIProvider } from '@/lib/di/provider';
import { createTestContainer, getMockAuthService } from '@/lib/di/test-utils';
import { useAuth } from '../useAuth';

describe('useAuth', () => {
  it('should return the current user', async () => {
    // Create a test container
    const container = createTestContainer();
    
    // Get the mock AuthService
    const mockAuthService = getMockAuthService(container);
    
    // Set up the mock user
    const mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
      permissions: []
    };
    
    mockAuthService.setMockUser(mockUser);
    
    // Render the hook with the test container
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DIProvider container={container}>
        {children}
      </DIProvider>
    );
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    
    // Wait for the hook to load the user
    await waitForNextUpdate();
    
    // Check that the user is returned
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.isAuthenticated).toBe(true);
  });
  
  it('should login a user', async () => {
    // Create a test container
    const container = createTestContainer();
    
    // Get the mock AuthService
    const mockAuthService = getMockAuthService(container);
    
    // Set up the mock user
    mockAuthService.setMockUser(null);
    
    // Render the hook with the test container
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DIProvider container={container}>
        {children}
      </DIProvider>
    );
    
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });
    
    // Wait for the hook to load the user
    await waitForNextUpdate();
    
    // Check that the user is not authenticated
    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
    
    // Login the user
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    // Check that the user is authenticated
    expect(result.current.user).not.toBe(null);
    expect(result.current.isAuthenticated).toBe(true);
  });
  
  // Add more tests for other functionality
});
```

## Step 12: Documentation

Add comprehensive documentation for the DI container:

1. Add JSDoc comments to all functions and classes
2. Update the project README to mention the DI container
3. Create a developer guide for using the DI container

## Implementation Checklist

- [ ] Define the DI container interface
- [ ] Create service tokens
- [ ] Implement the DI container
- [ ] Create a provider for React components
- [ ] Register services with the container
- [ ] Initialize the DI container in the application
- [ ] Update the AuthService to use the DI container
- [ ] Create mock services for testing
- [ ] Create a test setup utility
- [ ] Write tests using the DI container
- [ ] Add comprehensive documentation 