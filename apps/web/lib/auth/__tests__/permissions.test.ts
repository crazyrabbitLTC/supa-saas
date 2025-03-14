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
    
    it('should return true if user is the resource owner and action is delete', () => {
      expect(canPerformActionOnOwnedResource(regularUser, 'user-id', 'delete')).toBe(true);
    });
    
    it('should return false if user is not the resource owner and does not have permission', () => {
      expect(canPerformActionOnOwnedResource(regularUser, 'other-id', 'write')).toBe(false);
    });
    
    it('should return true if user is not the owner but has the required permission', () => {
      expect(canPerformActionOnOwnedResource(multiRoleUser, 'resource-1', 'write')).toBe(true);
    });
    
    it('should return false for unauthenticated users', () => {
      expect(canPerformActionOnOwnedResource(null, 'user-id', 'read')).toBe(false);
    });
  });
}); 