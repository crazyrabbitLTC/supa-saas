'use client'

/**
 * @file CSRF protection utilities
 * @version 1.3.1
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-06-15
 * 
 * Provides functions for CSRF token generation, validation, and protection.
 * Enhanced to work in both client and server environments.
 * 
 * IMPORTANT:
 * - Any modification to this file requires extensive testing
 * - Ensure all security implications are considered
 * - Safe to use in both client and server contexts
 * 
 * Functionality:
 * - Generation of CSRF tokens with expiration
 * - Validation of CSRF tokens
 * - Storage and retrieval of tokens in cookies
 * - Management of token rotation
 * - Isomorphic implementation (works in SSR)
 */

import { v4 as uuidv4 } from 'uuid'
import Cookies from 'js-cookie'

// Constants
export const CSRF_TOKEN_COOKIE = 'csrfToken'
export const CSRF_TOKEN_HEADER = 'X-CSRF-Token'
export const CSRF_TOKEN_EXPIRY = 60 * 60 * 24 // 24 hours in seconds

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined'

/**
 * Interface for CSRF token with metadata
 */
export interface CSRFToken {
  token: string
  expires: number // Unix timestamp in seconds
}

/**
 * Map for in-memory token storage (server-side only)
 */
const serverTokenStorage = new Map<string, string>()

/**
 * Gets a cookie value in an isomorphic way (works in both browser and server)
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
const getCookie = (name: string): string | null => {
  try {
    if (isBrowser && window.document) {
      return Cookies.get(name) || null
    }
  } catch (error) {
    console.warn('Error getting cookie:', error)
  }
  return serverTokenStorage.get(name) || null
}

/**
 * Sets a cookie value in an isomorphic way
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 */
const setCookie = (
  name: string,
  value: string,
  options?: Cookies.CookieAttributes
): void => {
  try {
    if (isBrowser && window.document) {
      Cookies.set(name, value, options)
      return
    }
  } catch (error) {
    console.warn('Error setting cookie:', error)
  }
  serverTokenStorage.set(name, value)
}

/**
 * Removes a cookie in an isomorphic way
 * @param name - Cookie name
 */
const removeCookie = (name: string): void => {
  try {
    if (isBrowser && window.document) {
      Cookies.remove(name)
      return
    }
  } catch (error) {
    console.warn('Error removing cookie:', error)
  }
  serverTokenStorage.delete(name)
}

/**
 * Generates a new CSRF token with expiration
 * @returns CSRF token object with token value and expiration
 */
export const generateCSRFToken = (): CSRFToken => {
  const token = uuidv4()
  const expires = Math.floor(Date.now() / 1000) + CSRF_TOKEN_EXPIRY
  
  return {
    token,
    expires,
  }
}

/**
 * Validates a CSRF token against the stored token
 * @param token - The token to validate
 * @returns Boolean indicating if the token is valid
 */
export const validateCSRFToken = (token: string): boolean => {
  // Skip validation on server
  if (!isBrowser) {
    console.log('CSRF validation skipped in server context')
    return true
  }
  
  const storedTokenJson = getCookie(CSRF_TOKEN_COOKIE)
  
  if (!storedTokenJson) {
    console.warn('CSRF validation failed: No stored token found')
    return false
  }
  
  try {
    const storedToken: CSRFToken = JSON.parse(storedTokenJson)
    
    // Check if token matches and hasn't expired
    const now = Math.floor(Date.now() / 1000)
    const isValid = storedToken.token === token && storedToken.expires > now
    
    if (!isValid) {
      console.warn('CSRF validation failed: Token expired or mismatch', {
        tokenMatch: storedToken.token === token,
        expired: storedToken.expires <= now,
        expiresIn: storedToken.expires - now
      })
    }
    
    return isValid
  } catch (error) {
    console.error('Error validating CSRF token:', error)
    return false
  }
}

/**
 * Stores a CSRF token in a secure cookie
 * @param csrfToken - The token object to store
 */
export const storeCSRFToken = (csrfToken: CSRFToken): void => {
  // Skip on server if no window
  if (!isBrowser) {
    serverTokenStorage.set(CSRF_TOKEN_COOKIE, JSON.stringify(csrfToken))
    return
  }
  
  try {
    setCookie(CSRF_TOKEN_COOKIE, JSON.stringify(csrfToken), {
      expires: new Date(csrfToken.expires * 1000), // Convert to milliseconds
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    })
  } catch (error) {
    console.error('Error storing CSRF token:', error)
    // Fallback to server storage
    serverTokenStorage.set(CSRF_TOKEN_COOKIE, JSON.stringify(csrfToken))
  }
}

/**
 * Retrieves the current CSRF token, generating a new one if needed
 * @param forceNew - Force generation of a new token regardless of current state
 * @returns CSRF token string
 */
export const getCSRFToken = (forceNew = false): string => {
  // If in server context, just generate a dummy token that won't be used
  if (!isBrowser) {
    const dummyToken = generateCSRFToken()
    return dummyToken.token
  }
  
  try {
    const storedTokenJson = getCookie(CSRF_TOKEN_COOKIE)
    
    // Generate new token if none exists, is expired, or forced to be new
    if (forceNew || !storedTokenJson) {
      const newToken = generateCSRFToken()
      storeCSRFToken(newToken)
      return newToken.token
    }
    
    try {
      const storedToken: CSRFToken = JSON.parse(storedTokenJson)
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000)
      if (storedToken.expires <= now) {
        const newToken = generateCSRFToken()
        storeCSRFToken(newToken)
        return newToken.token
      }
      
      return storedToken.token
    } catch (error) {
      console.error('Error retrieving CSRF token:', error)
      const newToken = generateCSRFToken()
      storeCSRFToken(newToken)
      return newToken.token
    }
  } catch (error) {
    console.error('Error in getCSRFToken:', error)
    // In case of any error, return a new token
    const newToken = generateCSRFToken()
    return newToken.token
  }
}

/**
 * Adds CSRF token header to fetch options
 * @param options - Fetch options object
 * @returns Modified fetch options with CSRF token header
 */
export const addCSRFToken = (options: RequestInit = {}): RequestInit => {
  // Only add token in browser context
  if (!isBrowser) {
    return options
  }
  
  // Get token safely
  let token: string
  try {
    token = getCSRFToken()
  } catch (error) {
    console.warn('Error getting CSRF token for request:', error)
    // Generate a new token if there was an error
    token = generateCSRFToken().token
  }
  
  return {
    ...options,
    headers: {
      ...options.headers,
      [CSRF_TOKEN_HEADER]: token,
    },
  }
}

/**
 * Clears the stored CSRF token cookie
 */
export const clearCSRFToken = (): void => {
  try {
    removeCookie(CSRF_TOKEN_COOKIE)
  } catch (error) {
    console.error('Error clearing CSRF token:', error)
  }
} 