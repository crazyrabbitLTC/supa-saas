# Authentication System Documentation

## Overview

This document provides a comprehensive guide to the authentication system implemented in the application. It covers the authentication flow, security measures, and usage of the authentication service.

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Authentication Service](#authentication-service)
3. [CSRF Protection](#csrf-protection)
4. [Cookie Security](#cookie-security)
5. [Error Handling](#error-handling)
6. [Permission System](#permission-system)
7. [Extending the Authentication System](#extending-the-authentication-system)
8. [Testing Authentication](#testing-authentication)

## Authentication Flow

The authentication flow in the application follows these steps:

1. **User Registration (Signup)**
   - User submits registration form with email, password, and other required information
   - Server validates the input data
   - If valid, the server creates a new user account
   - Server generates a session token and sets it in an HTTP-only cookie
   - User is now authenticated

2. **User Login**
   - User submits login form with email and password
   - Server validates the credentials
   - If valid, the server generates a session token and sets it in an HTTP-only cookie
   - User is now authenticated

3. **Session Management**
   - Each authenticated request includes the session cookie
   - Server validates the session token on each request
   - If the token is valid, the request is processed
   - If the token is invalid or expired, the user is redirected to login

4. **Password Reset**
   - User requests a password reset by providing their email
   - Server generates a password reset token and sends it to the user's email
   - User clicks the link in the email and is directed to a password reset form
   - User submits a new password along with the reset token
   - Server validates the token and updates the password
   - User can now log in with the new password

5. **Logout**
   - User requests to log out
   - Server invalidates the session token
   - Server clears the session cookie
   - User is now logged out

## Authentication Service

The authentication service (`AuthService`) centralizes all authentication-related functionality. It implements the `IAuthService` interface and provides the following methods:

- `login(email: string, password: string): Promise<User>`
- `logout(): Promise<void>`
- `signup(userData: UserSignupData): Promise<User>`
- `resetPassword(email: string): Promise<void>`
- `updatePassword(token: string, newPassword: string): Promise<void>`
- `getUser(): Promise<User | null>`
- `refreshSession(): Promise<void>`
- `generateCSRFToken(): string`
- `validateCSRFToken(token: string): boolean`

### Using the Authentication Service

The authentication service can be accessed in two ways:

1. **Using the `useAuth` hook (recommended for React components)**

```tsx
import { useAuth } from '@/hooks/useAuth';

function LoginForm() {
  const { login, error, isLoading } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    try {
      await login(email, password);
      // Redirect or show success message
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

2. **Using dependency injection (for services and non-React code)**

```typescript
import { getContainer } from '@/lib/di/container';
import { AUTH_SERVICE } from '@/lib/di/tokens';
import { IAuthService } from '@/lib/di/interfaces/auth-service.interface';

async function authenticateUser(email: string, password: string) {
  const container = getContainer();
  const authService = container.get<IAuthService>(AUTH_SERVICE);
  
  try {
    const user = await authService.login(email, password);
    return user;
  } catch (error) {
    // Handle error
    throw error;
  }
}
```

## CSRF Protection

The application implements Cross-Site Request Forgery (CSRF) protection using the double-submit cookie pattern:

1. When a form is rendered, the server generates a CSRF token using `authService.generateCSRFToken()`
2. The token is included in the form as a hidden field
3. When the form is submitted, the token is sent along with the form data
4. The server validates the token using `authService.validateCSRFToken(token)`
5. If the token is valid, the request is processed
6. If the token is invalid, the request is rejected with a CSRF error

### CSRF Token Implementation

The CSRF token implementation in the `AuthService` uses a Map to store tokens and their expiration times:

```typescript
// Generate a CSRF token
generateCSRFToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  this.csrfTokens.set(token, Date.now() + 3600000); // Token valid for 1 hour
  
  // Clean up expired tokens
  this.cleanupExpiredTokens();
  
  return token;
}

// Validate a CSRF token
validateCSRFToken(token: string): boolean {
  if (!token || !this.csrfTokens.has(token)) {
    return false;
  }
  
  const expiryTime = this.csrfTokens.get(token);
  
  if (!expiryTime || Date.now() > expiryTime) {
    this.csrfTokens.delete(token);
    return false;
  }
  
  // Token is valid, remove it to prevent reuse
  this.csrfTokens.delete(token);
  return true;
}
```

## Cookie Security

The application uses HTTP-only cookies for session management with the following security settings:

- **HttpOnly**: Prevents JavaScript access to the cookie, mitigating XSS attacks
- **Secure**: Ensures the cookie is only sent over HTTPS connections
- **SameSite=Lax**: Provides some CSRF protection while allowing normal navigation
- **Path=/**: Restricts the cookie to the root path
- **Max-Age**: Sets the cookie expiration time (typically 7 days)

Example cookie configuration:

```typescript
// Set session cookie
res.setHeader('Set-Cookie', [
  `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 7}`
]);
```

## Error Handling

The authentication system uses custom error classes for consistent error handling:

- `AuthError`: For authentication-related errors (invalid credentials, expired tokens)
- `ValidationError`: For validation errors (invalid email format, password too short)
- `CSRFError`: For CSRF token validation errors
- `ForbiddenError`: For permission-related errors

These errors are handled consistently throughout the application using the error utilities in `apps/web/lib/errors/error-utils.ts`.

## Permission System

The application implements a role-based permission system with the following components:

- **Roles**: Users can have one or more roles (e.g., 'admin', 'user', 'editor')
- **Permissions**: Each role grants specific permissions
- **Resource Access**: Permissions control access to resources and actions

The permission utilities in `apps/web/lib/auth/permissions.ts` provide the following functions:

- `isAuthenticated(user: User | null): boolean`
- `hasRole(user: User | null, role: string | string[]): boolean`
- `canAccessResource(user: User | null, resourceId: string, action: 'read' | 'write' | 'delete'): boolean`
- `isResourceOwner(user: User | null, resourceOwnerId: string): boolean`
- `canPerformActionOnOwnedResource(user: User | null, resourceOwnerId: string, action: 'read' | 'write' | 'delete'): boolean`

### Using Permission Utilities

```typescript
import { hasRole, canAccessResource } from '@/lib/auth/permissions';

// Check if user has admin role
if (hasRole(user, 'admin')) {
  // Allow admin actions
}

// Check if user can access a resource
if (canAccessResource(user, 'project-123', 'write')) {
  // Allow write access to the resource
}
```

## Extending the Authentication System

The authentication system can be extended in the following ways:

### Adding Social Login

To add social login (e.g., Google, GitHub, Facebook), you would:

1. Create a new OAuth provider configuration
2. Implement the OAuth flow in the API routes
3. Add the social login methods to the `AuthService` interface and implementation
4. Update the UI to include social login buttons

### Adding Two-Factor Authentication (2FA)

To add 2FA, you would:

1. Add 2FA fields to the user model
2. Implement 2FA setup and verification in the API routes
3. Add 2FA methods to the `AuthService` interface and implementation
4. Create UI components for 2FA setup and verification

## Testing Authentication

The authentication system includes mock implementations for testing:

- `MockAuthService`: A mock implementation of the `IAuthService` interface
- `TestDIProvider`: A provider component for testing with dependency injection
- `createTestContainer()`: A function to create a test container with mock services

### Example Test

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestDIProvider, createTestContainer, getMockAuthService } from '@/lib/di/test-utils';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  it('should log in the user when valid credentials are provided', async () => {
    const container = createTestContainer();
    const mockAuthService = getMockAuthService(container);
    
    render(
      <TestDIProvider container={container}>
        <LoginForm />
      </TestDIProvider>
    );
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    
    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password');
    });
  });
}); 