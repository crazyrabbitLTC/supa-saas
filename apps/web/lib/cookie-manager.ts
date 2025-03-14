/**
 * @file Cookie Management Utility
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-06-15
 * 
 * Centralized cookie management utility for secure cookie handling.
 * 
 * IMPORTANT:
 * - Any modification requires extensive testing
 * - Security features must remain intact
 * 
 * Functionality:
 * - Secure cookie setting with standardized security attributes
 * - Cookie retrieval and deletion
 * - Support for both client and server contexts
 */

import { cookies } from 'next/headers'
import { ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies'

// Check if in browser environment
const isBrowser = typeof window !== 'undefined'

// Cookie security prefixes
export const SECURE_PREFIX = '__Secure-'
export const HOST_PREFIX = '__Host-'

/**
 * Cookie options interface
 */
export interface CookieOptions {
  value: string
  expires?: Date
  maxAge?: number
  domain?: string
  path?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
}

/**
 * Default security options for cookies
 */
export const DEFAULT_SECURE_OPTIONS: Partial<CookieOptions> = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/',
}

/**
 * Cookie types with predefined security settings
 */
export enum CookieType {
  // Authentication cookies - highest security
  AUTH = 'auth',
  // Session state cookies - high security
  SESSION = 'session',
  // Preference cookies - medium security
  PREFERENCE = 'preference',
  // Analytics cookies - lower security
  ANALYTICS = 'analytics',
}

/**
 * Get cookie security options based on cookie type
 * @param type - Cookie type
 * @returns Cookie options with appropriate security settings
 */
export function getCookieSecurityOptions(type: CookieType): Partial<CookieOptions> {
  switch (type) {
    case CookieType.AUTH:
      return {
        ...DEFAULT_SECURE_OPTIONS,
        // Auth cookies should have shorter expiration
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }
    case CookieType.SESSION:
      return {
        ...DEFAULT_SECURE_OPTIONS,
        // Session cookies expire when browser closes
        expires: undefined,
        maxAge: undefined,
      }
    case CookieType.PREFERENCE:
      return {
        httpOnly: true,
        secure: true,
        sameSite: 'lax', // Allow cross-site requests for better UX
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      }
    case CookieType.ANALYTICS:
      return {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      }
    default:
      return DEFAULT_SECURE_OPTIONS
  }
}

/**
 * Apply security prefix to cookie name based on options
 * @param name - Original cookie name
 * @param options - Cookie options
 * @returns Cookie name with appropriate security prefix
 */
export function getSecureCookieName(name: string, options: Partial<CookieOptions>): string {
  // If cookie is secure and restricted to a specific path
  if (options.secure && options.path === '/') {
    // Use __Host- prefix for cookies that are bound to the host
    if (!options.domain) {
      return `${HOST_PREFIX}${name}`
    }
    // Use __Secure- prefix for cookies that require secure connection
    return `${SECURE_PREFIX}${name}`
  }
  return name
}

/**
 * Set a cookie with security options in server context
 * @param cookieStore - ResponseCookies object
 * @param name - Cookie name
 * @param value - Cookie value
 * @param type - Cookie type for security settings
 * @param additionalOptions - Additional cookie options
 */
export function setServerCookie(
  cookieStore: ResponseCookies,
  name: string,
  value: string,
  type: CookieType = CookieType.SESSION,
  additionalOptions: Partial<CookieOptions> = {}
): void {
  const options = {
    ...getCookieSecurityOptions(type),
    ...additionalOptions,
    value,
  }
  
  const secureName = getSecureCookieName(name, options)
  
  cookieStore.set({
    name: secureName,
    value,
    httpOnly: options.httpOnly,
    secure: options.secure,
    sameSite: options.sameSite,
    path: options.path,
    domain: options.domain,
    expires: options.expires,
    maxAge: options.maxAge,
  })
}

/**
 * Get a cookie value in server context
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getServerCookie(name: string): string | null {
  try {
    const cookieStore = cookies()
    
    // Try with different prefixes
    const value = 
      cookieStore.get(`${HOST_PREFIX}${name}`)?.value ||
      cookieStore.get(`${SECURE_PREFIX}${name}`)?.value ||
      cookieStore.get(name)?.value
    
    return value || null
  } catch (error) {
    console.error(`Error getting cookie ${name}:`, error)
    return null
  }
}

/**
 * Delete a cookie in server context
 * @param cookieStore - ResponseCookies object
 * @param name - Cookie name
 */
export function deleteServerCookie(cookieStore: ResponseCookies, name: string): void {
  // Delete all possible prefixed versions
  cookieStore.delete(`${HOST_PREFIX}${name}`)
  cookieStore.delete(`${SECURE_PREFIX}${name}`)
  cookieStore.delete(name)
}

/**
 * Set a cookie with security options in API route
 * @param response - NextResponse object
 * @param name - Cookie name
 * @param value - Cookie value
 * @param type - Cookie type for security settings
 * @param additionalOptions - Additional cookie options
 */
export function setApiCookie(
  response: Response,
  name: string,
  value: string,
  type: CookieType = CookieType.SESSION,
  additionalOptions: Partial<CookieOptions> = {}
): void {
  if (!response.headers) {
    console.error('Response headers not available')
    return
  }
  
  const options = {
    ...getCookieSecurityOptions(type),
    ...additionalOptions,
  }
  
  const secureName = getSecureCookieName(name, options)
  
  // Build cookie string
  let cookieValue = `${secureName}=${value}`
  
  if (options.expires) {
    cookieValue += `; Expires=${options.expires.toUTCString()}`
  }
  
  if (options.maxAge !== undefined) {
    cookieValue += `; Max-Age=${options.maxAge}`
  }
  
  if (options.domain) {
    cookieValue += `; Domain=${options.domain}`
  }
  
  if (options.path) {
    cookieValue += `; Path=${options.path}`
  }
  
  if (options.secure) {
    cookieValue += '; Secure'
  }
  
  if (options.httpOnly) {
    cookieValue += '; HttpOnly'
  }
  
  if (options.sameSite) {
    cookieValue += `; SameSite=${options.sameSite}`
  }
  
  response.headers.append('Set-Cookie', cookieValue)
} 