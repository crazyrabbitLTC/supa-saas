/**
 * @file Service Tokens
 * @description Defines tokens for services in the dependency injection container
 */

/**
 * Token for the authentication service
 */
export const AUTH_SERVICE = Symbol('AUTH_SERVICE');

/**
 * Token for the user service
 */
export const USER_SERVICE = Symbol('USER_SERVICE');

/**
 * Token for the team service
 */
export const TEAM_SERVICE = Symbol('TEAM_SERVICE');

/**
 * Token for the project service
 */
export const PROJECT_SERVICE = Symbol('PROJECT_SERVICE');

/**
 * Token for the notification service
 */
export const NOTIFICATION_SERVICE = Symbol('NOTIFICATION_SERVICE');

/**
 * Token for the analytics service
 */
export const ANALYTICS_SERVICE = Symbol('ANALYTICS_SERVICE'); 