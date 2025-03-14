/**
 * @file DI Container
 * @description Implementation of the dependency injection container
 */

import { IDIContainer } from './interfaces/container.interface';

/**
 * Type for a service factory function
 */
type ServiceFactory<T> = () => T;

/**
 * Type for a service registration
 */
interface ServiceRegistration<T> {
  factory: ServiceFactory<T>;
  singleton: boolean;
  instance?: T;
}

/**
 * Implementation of the dependency injection container
 */
export class DIContainer implements IDIContainer {
  private services: Map<symbol, ServiceRegistration<any>> = new Map();
  
  /**
   * Register a service with the container
   * @param token The token to register the service under
   * @param factory A factory function that creates the service
   */
  register<T>(token: symbol, factory: ServiceFactory<T>): void {
    this.services.set(token, {
      factory,
      singleton: false
    });
  }
  
  /**
   * Register a singleton service with the container
   * @param token The token to register the service under
   * @param factory A factory function that creates the service
   */
  registerSingleton<T>(token: symbol, factory: ServiceFactory<T>): void {
    this.services.set(token, {
      factory,
      singleton: true
    });
  }
  
  /**
   * Get a service from the container
   * @param token The token to get the service for
   * @returns The service instance
   * @throws Error if the service is not registered
   */
  get<T>(token: symbol): T {
    const registration = this.services.get(token);
    
    if (!registration) {
      throw new Error(`Service not registered for token: ${String(token)}`);
    }
    
    if (registration.singleton) {
      if (!registration.instance) {
        registration.instance = registration.factory();
      }
      
      return registration.instance;
    }
    
    return registration.factory();
  }
  
  /**
   * Check if a service is registered with the container
   * @param token The token to check
   * @returns True if the service is registered, false otherwise
   */
  has(token: symbol): boolean {
    return this.services.has(token);
  }
  
  /**
   * Reset the container, removing all registered services
   * Useful for testing
   */
  reset(): void {
    this.services.clear();
  }
}

// Create a singleton instance of the container
const container = new DIContainer();

/**
 * Get the global DI container instance
 * @returns The global DI container instance
 */
export function getContainer(): IDIContainer {
  return container;
} 