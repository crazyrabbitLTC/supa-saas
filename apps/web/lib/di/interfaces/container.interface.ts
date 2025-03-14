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
   * Useful for testing
   */
  reset(): void;
} 