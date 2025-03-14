/**
 * @file DI Test Utilities
 * @description Utility functions for testing with dependency injection
 */

import React, { ReactNode } from 'react';
import { DIContainer } from './container';
import { DIProvider } from './provider';
import { AUTH_SERVICE } from './tokens';
import { MockAuthService } from './mocks/auth-service.mock';

/**
 * Create a test container with mock services
 * @returns A DI container with mock services
 */
export function createTestContainer(): DIContainer {
  const container = new DIContainer();
  
  // Register mock services
  container.registerSingleton(AUTH_SERVICE, () => new MockAuthService());
  
  return container;
}

/**
 * Props for the TestDIProvider component
 */
interface TestDIProviderProps {
  children: ReactNode;
  container?: DIContainer;
}

/**
 * Provider component for testing with dependency injection
 * @param props The component props
 * @returns The provider component
 */
export function TestDIProvider({ 
  children, 
  container = createTestContainer() 
}: TestDIProviderProps): JSX.Element {
  return (
    <DIProvider container={container}>
      {children}
    </DIProvider>
  );
}

/**
 * Get the mock auth service from a test container
 * @param container The test container
 * @returns The mock auth service
 */
export function getMockAuthService(container: DIContainer): MockAuthService {
  return container.get<MockAuthService>(AUTH_SERVICE);
} 