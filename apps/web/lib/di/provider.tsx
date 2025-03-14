/**
 * @file DI Provider
 * @description React context provider for dependency injection
 */

'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { IDIContainer } from './interfaces/container.interface';
import { getContainer } from './container';
import { AUTH_SERVICE } from './tokens';
import { AuthService } from '../auth/auth-service';

// Create a context for the DI container
const DIContext = createContext<IDIContainer | null>(null);

/**
 * Props for the DIProvider component
 */
interface DIProviderProps {
  children: ReactNode;
  container?: IDIContainer;
}

/**
 * Register default services with the container
 * @param container The DI container
 */
function registerDefaultServices(container: IDIContainer): void {
  // Register the AuthService as a singleton
  if (!container.has(AUTH_SERVICE)) {
    container.registerSingleton(AUTH_SERVICE, () => new AuthService());
  }
  
  // Register other services here
}

/**
 * Provider component for dependency injection
 * @param props The component props
 * @returns The provider component
 */
export function DIProvider({ children, container = getContainer() }: DIProviderProps): JSX.Element {
  // Register default services
  registerDefaultServices(container);
  
  return (
    <DIContext.Provider value={container}>
      {children}
    </DIContext.Provider>
  );
}

/**
 * Hook to access the DI container
 * @returns The DI container
 * @throws Error if used outside of a DIProvider
 */
export function useDIContainer(): IDIContainer {
  const container = useContext(DIContext);
  
  if (!container) {
    throw new Error('useDIContainer must be used within a DIProvider');
  }
  
  return container;
}

/**
 * Hook to get a service from the DI container
 * @param token The token for the service
 * @returns The service instance
 */
export function useService<T>(token: symbol): T {
  const container = useDIContainer();
  return container.get<T>(token);
} 