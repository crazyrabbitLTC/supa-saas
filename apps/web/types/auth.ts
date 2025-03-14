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

export interface UserSignupData {
  email: string;
  password: string;
  name?: string;
  // Add other signup fields as needed
} 