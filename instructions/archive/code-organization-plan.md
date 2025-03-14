# Code Organization and Duplication Improvement Plan

## Overview

This document outlines the detailed implementation plan for addressing code organization and duplication issues identified in the security implementation plan (Phase 3, Item 6). The goal is to improve maintainability, testability, and security by centralizing authentication logic, creating reusable utility functions, and implementing proper dependency injection.

## Current State Analysis

Before implementing changes, we need to analyze the current state of the codebase to identify:

1. Duplicated authentication and permission check logic
2. Error handling patterns that could be centralized
3. Areas where dependency injection would improve testability
4. Security-related code that lacks proper documentation

## Implementation Checklist

### 6.1. Create Utility Functions for Common Permission Checks

- [ ] **6.1.1.** Identify all permission check patterns in the codebase
- [ ] **6.1.2.** Create a `permissions.ts` utility file in `apps/web/lib/auth/`
- [ ] **6.1.3.** Implement the following utility functions:
  - [ ] `isAuthenticated(user: User | null): boolean`
  - [ ] `hasRole(user: User | null, role: string | string[]): boolean`
  - [ ] `canAccessResource(user: User | null, resourceId: string, action: 'read' | 'write' | 'delete'): boolean`
  - [ ] `isResourceOwner(user: User | null, resourceOwnerId: string): boolean`
- [ ] **6.1.4.** Add proper TypeScript types and documentation for each function
- [ ] **6.1.5.** Refactor existing code to use these utility functions
- [ ] **6.1.6.** Add unit tests for each utility function

### 6.2. Refactor Duplicated Error Handling Code

- [ ] **6.2.1.** Identify common error handling patterns across the application
- [ ] **6.2.2.** Create an `error-utils.ts` file in `apps/web/lib/errors/`
- [ ] **6.2.3.** Implement the following utility functions:
  - [ ] `handleAuthError(error: Error): { message: string, code: string }`
  - [ ] `handleValidationError(error: Error): { message: string, fields: Record<string, string> }`
  - [ ] `handleServerError(error: Error): { message: string, code: string }`
  - [ ] `isAuthError(error: Error): boolean`
  - [ ] `isValidationError(error: Error): boolean`
- [ ] **6.2.4.** Create consistent error response formatters for API routes
- [ ] **6.2.5.** Refactor existing error handling code to use these utilities
- [ ] **6.2.6.** Add unit tests for error handling utilities

### 6.3. Centralize Authentication Logic in a Dedicated Service

- [ ] **6.3.1.** Create an `AuthService` class in `apps/web/lib/auth/auth-service.ts`
- [ ] **6.3.2.** Implement the following methods:
  - [ ] `login(email: string, password: string): Promise<User>`
  - [ ] `logout(): Promise<void>`
  - [ ] `signup(userData: UserSignupData): Promise<User>`
  - [ ] `resetPassword(email: string): Promise<void>`
  - [ ] `updatePassword(token: string, newPassword: string): Promise<void>`
  - [ ] `getUser(): Promise<User | null>`
  - [ ] `refreshSession(): Promise<void>`
  - [ ] `generateCSRFToken(): string`
  - [ ] `validateCSRFToken(token: string): boolean`
- [ ] **6.3.3.** Move existing authentication logic from various files into this service
- [ ] **6.3.4.** Add proper error handling and logging within the service
- [ ] **6.3.5.** Create TypeScript interfaces for all input/output types
- [ ] **6.3.6.** Add unit tests for the AuthService

### 6.4. Implement Dependency Injection for Better Testability

- [ ] **6.4.1.** Create a simple dependency injection container in `apps/web/lib/di/container.ts`
- [ ] **6.4.2.** Define interfaces for all services in `apps/web/lib/di/interfaces/`
- [ ] **6.4.3.** Register the AuthService and other services in the container
- [ ] **6.4.4.** Update components and API routes to use the DI container
- [ ] **6.4.5.** Create mock implementations for testing
- [ ] **6.4.6.** Add unit tests that leverage the DI container for easier mocking

### 6.5. Document the Authentication Flow and Security Practices

- [ ] **6.5.1.** Create a comprehensive authentication flow diagram
- [ ] **6.5.2.** Document the CSRF protection mechanism
- [ ] **6.5.3.** Document the cookie security configuration
- [ ] **6.5.4.** Create API documentation for all authentication endpoints
- [ ] **6.5.5.** Document the error handling strategy
- [ ] **6.5.6.** Add inline documentation for all security-related code
- [ ] **6.5.7.** Create a developer guide for working with the authentication system

## Implementation Approach

1. **Start with Analysis**: Begin by analyzing the current codebase to identify patterns and duplication.
2. **Create Core Utilities First**: Implement the permission and error handling utilities first, as they're foundational.
3. **Build the Auth Service**: Centralize authentication logic in the AuthService class.
4. **Implement DI Container**: Add the dependency injection container to improve testability.
5. **Refactor Existing Code**: Update components and API routes to use the new utilities and services.
6. **Add Documentation**: Document the authentication flow and security practices.
7. **Write Tests**: Add comprehensive tests for all new code.

## Success Criteria

- All permission checks use centralized utility functions
- Error handling is consistent across the application
- Authentication logic is centralized in the AuthService
- Components and API routes use dependency injection
- All security-related code is well-documented
- Test coverage for new utilities and services is at least 80%

## Dependencies

- Existing authentication implementation from Phase 1 and 2
- Error handling improvements from Phase 2
- Testing framework and tools

## Estimated Timeline

- Analysis and planning: 0.5 day
- Implementing utility functions: 1 day
- Creating the AuthService: 1 day
- Implementing dependency injection: 0.5 day
- Documentation: 0.5 day
- Testing: 0.5 day

Total: 4 days 