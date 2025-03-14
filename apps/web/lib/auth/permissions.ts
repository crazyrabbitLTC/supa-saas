/**
 * @file Permission Utility Functions
 * @description Centralized utility functions for checking user permissions
 */

import { User, ResourceAction } from '@/types/auth';

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
  action: ResourceAction
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
  action: ResourceAction
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