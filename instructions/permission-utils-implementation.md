# Permission Utility Functions Implementation Guide

## Overview

This document provides a detailed implementation guide for creating utility functions for common permission checks (Task 6.1 in the Code Organization Plan). These utility functions will centralize permission logic, improve code readability, and reduce duplication across the application.

## Step 1: Analyze Current Permission Patterns

Before implementing the utility functions, we need to identify all permission check patterns in the codebase:

1. Check if a user is authenticated
2. Check if a user has a specific role
3. Check if a user can access a specific resource
4. Check if a user is the owner of a resource

## Step 2: Create the Permission Utility File

Create a new file at `apps/web/lib/auth/permissions.ts` with the following structure:

```typescript
/**
 * @file Permission Utility Functions
 * @description Centralized utility functions for checking user permissions
 */

import { User } from '@/types/auth';

/**
 * Check if a user is authenticated
 * @param user The user object or null
 * @returns True if the user is authenticated, false otherwise
 */
export function isAuthenticated(user: User | null): boolean {
  return user !== null;
}

/**
 * Check if a user has a specific role or any of the specified roles
 * @param user The user object or null
 * @param role A single role or array of roles to check
 * @returns True if the user has the specified role(s), false otherwise
 */
export function hasRole(user: User | null, role: string | string[]): boolean {
  if (!isAuthenticated(user)) {
    return false;
  }

  const userRoles = user.roles || [];
  
  if (Array.isArray(role)) {
    return role.some(r => userRoles.includes(r));
  }
  
  return userRoles.includes(role);
}

/**
 * Check if a user can access a resource with the specified action
 * @param user The user object or null
 * @param resourceId The ID of the resource
 * @param action The action to perform on the resource (read, write, delete)
 * @returns True if the user can access the resource, false otherwise
 */
export function canAccessResource(
  user: User | null, 
  resourceId: string, 
  action: 'read' | 'write' | 'delete'
): boolean {
  if (!isAuthenticated(user)) {
    return false;
  }

  // Admin users can access any resource
  if (hasRole(user, 'admin')) {
    return true;
  }

  // Implement resource-specific permission logic here
  // This is a placeholder implementation that should be customized
  // based on your application's permission model
  
  // For example, you might check a permissions array on the user object
  const userPermissions = user.permissions || [];
  const requiredPermission = `${resourceId}:${action}`;
  
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if a user is the owner of a resource
 * @param user The user object or null
 * @param resourceOwnerId The ID of the resource owner
 * @returns True if the user is the owner, false otherwise
 */
export function isResourceOwner(user: User | null, resourceOwnerId: string): boolean {
  if (!isAuthenticated(user)) {
    return false;
  }
  
  return user.id === resourceOwnerId;
}

/**
 * Check if a user can perform an action on a resource they own
 * @param user The user object or null
 * @param resourceOwnerId The ID of the resource owner
 * @param action The action to perform on the resource
 * @returns True if the user can perform the action, false otherwise
 */
export function canPerformActionOnOwnedResource(
  user: User | null,
  resourceOwnerId: string,
  action: 'read' | 'write' | 'delete'
): boolean {
  // Users can always read their own resources
  if (action === 'read' && isResourceOwner(user, resourceOwnerId)) {
    return true;
  }
  
  // For write and delete, check if the user is the owner
  if (['write', 'delete'].includes(action) && isResourceOwner(user, resourceOwnerId)) {
    return true;
  }
  
  // If not the owner, fall back to regular permission check
  return canAccessResource(user, resourceOwnerId, action);
}
```

## Step 3: Create Types for Permission Functions

Create a new file at `apps/web/types/auth.ts` (if it doesn't already exist) with the following types:

```typescript
/**
 * @file Auth Types
 * @description Type definitions for authentication and permissions
 */

export interface User {
  id: string;
  email: string;
  roles?: string[];
  permissions?: string[];
  // Add other user properties as needed
}

export type ResourceAction = 'read' | 'write' | 'delete';

export interface Permission {
  resourceId: string;
  action: ResourceAction;
}
```

## Step 4: Create Unit Tests

Create a new file at `apps/web/lib/auth/__tests__/permissions.test.ts` with the following tests:

```typescript
/**
 * @file Permission Utility Tests
 * @description Unit tests for permission utility functions
 */

import { 
  isAuthenticated, 
  hasRole, 
  canAccessResource, 
  isResourceOwner,
  canPerformActionOnOwnedResource
} from '../permissions';
import { User } from '@/types/auth';

describe('Permission Utilities', () => {
  // Test user objects
  const adminUser: User = {
    id: 'admin-id',
    email: 'admin@example.com',
    roles: ['admin'],
    permissions: ['resource-1:read', 'resource-1:write', 'resource-1:delete']
  };
  
  const regularUser: User = {
    id: 'user-id',
    email: 'user@example.com',
    roles: ['user'],
    permissions: ['resource-1:read']
  };
  
  const multiRoleUser: User = {
    id: 'multi-role-id',
    email: 'multi@example.com',
    roles: ['user', 'editor'],
    permissions: ['resource-1:read', 'resource-1:write']
  };

  describe('isAuthenticated', () => {
    it('should return true for authenticated users', () => {
      expect(isAuthenticated(adminUser)).toBe(true);
      expect(isAuthenticated(regularUser)).toBe(true);
    });
    
    it('should return false for unauthenticated users', () => {
      expect(isAuthenticated(null)).toBe(false);
    });
  });
  
  describe('hasRole', () => {
    it('should return true if user has the specified role', () => {
      expect(hasRole(adminUser, 'admin')).toBe(true);
      expect(hasRole(regularUser, 'user')).toBe(true);
    });
    
    it('should return true if user has any of the specified roles', () => {
      expect(hasRole(multiRoleUser, ['admin', 'editor'])).toBe(true);
    });
    
    it('should return false if user does not have the specified role', () => {
      expect(hasRole(regularUser, 'admin')).toBe(false);
    });
    
    it('should return false for unauthenticated users', () => {
      expect(hasRole(null, 'admin')).toBe(false);
    });
  });
  
  describe('canAccessResource', () => {
    it('should return true for admin users', () => {
      expect(canAccessResource(adminUser, 'resource-1', 'read')).toBe(true);
      expect(canAccessResource(adminUser, 'resource-2', 'write')).toBe(true);
    });
    
    it('should return true if user has the required permission', () => {
      expect(canAccessResource(regularUser, 'resource-1', 'read')).toBe(true);
    });
    
    it('should return false if user does not have the required permission', () => {
      expect(canAccessResource(regularUser, 'resource-1', 'write')).toBe(false);
    });
    
    it('should return false for unauthenticated users', () => {
      expect(canAccessResource(null, 'resource-1', 'read')).toBe(false);
    });
  });
  
  describe('isResourceOwner', () => {
    it('should return true if user is the resource owner', () => {
      expect(isResourceOwner(regularUser, 'user-id')).toBe(true);
    });
    
    it('should return false if user is not the resource owner', () => {
      expect(isResourceOwner(regularUser, 'other-id')).toBe(false);
    });
    
    it('should return false for unauthenticated users', () => {
      expect(isResourceOwner(null, 'user-id')).toBe(false);
    });
  });
  
  describe('canPerformActionOnOwnedResource', () => {
    it('should return true if user is the resource owner and action is read', () => {
      expect(canPerformActionOnOwnedResource(regularUser, 'user-id', 'read')).toBe(true);
    });
    
    it('should return true if user is the resource owner and action is write', () => {
      expect(canPerformActionOnOwnedResource(regularUser, 'user-id', 'write')).toBe(true);
    });
    
    it('should return false if user is not the resource owner and lacks permission', () => {
      expect(canPerformActionOnOwnedResource(regularUser, 'other-id', 'write')).toBe(false);
    });
  });
});
```

## Step 5: Refactor Existing Code

After implementing the permission utility functions, refactor existing code to use them. Here are some examples of how to use these functions:

### Example 1: Protecting API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, hasRole } from '@/lib/auth/permissions';
import { getUser } from '@/lib/auth/user';

export async function GET(req: NextRequest) {
  const user = await getUser();
  
  if (!isAuthenticated(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Continue with the request
  return NextResponse.json({ data: 'Protected data' });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  
  if (!hasRole(user, 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Continue with the request
  return NextResponse.json({ data: 'Admin action completed' });
}
```

### Example 2: Protecting UI Components

```tsx
import { useUser } from '@/hooks/useUser';
import { hasRole, canAccessResource } from '@/lib/auth/permissions';

export function AdminPanel() {
  const { user } = useUser();
  
  if (!hasRole(user, 'admin')) {
    return <p>You do not have permission to view this page.</p>;
  }
  
  return (
    <div>
      <h1>Admin Panel</h1>
      {/* Admin panel content */}
    </div>
  );
}

export function ResourceView({ resourceId }: { resourceId: string }) {
  const { user } = useUser();
  
  if (!canAccessResource(user, resourceId, 'read')) {
    return <p>You do not have permission to view this resource.</p>;
  }
  
  return (
    <div>
      <h1>Resource {resourceId}</h1>
      {/* Resource content */}
    </div>
  );
}
```

## Step 6: Documentation

Add comprehensive documentation for the permission utility functions:

1. Add JSDoc comments to all functions (as shown in the implementation)
2. Update the project README to mention the permission utilities
3. Create a developer guide for using the permission utilities

## Implementation Checklist

- [ ] Analyze current permission patterns in the codebase
- [ ] Create the `permissions.ts` utility file
- [ ] Implement the core permission functions
- [ ] Create TypeScript types for permissions
- [ ] Write unit tests for all functions
- [ ] Refactor existing code to use the utility functions
- [ ] Add comprehensive documentation 