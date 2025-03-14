'use client'

/**
 * @file CSRF protection utilities
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-06-14
 * 
 * Provides functions for CSRF token generation, validation, and protection.
 * 
 * IMPORTANT:
 * - Any modification to this file requires extensive testing
 * - Ensure all security implications are considered
 * 
 * Functionality:
 * - Generation of CSRF tokens with expiration
 * - Validation of CSRF tokens
 * - Storage and retrieval of tokens in cookies
 * - Management of token rotation
 */

import { v4 as uuidv4 } from 'uuid'
import Cookies from 'js-cookie'

// Constants
const CSRF_TOKEN_COOKIE = 'csrfToken'
const CSRF_TOKEN_HEADER = 'X-CSRF-Token'
const CSRF_TOKEN_EXPIRY = 60 * 60 * 24 // 24 hours in seconds

/**
 * Interface for CSRF token with metadata
 */
interface CSRFToken {
  token: string
  expires: number // Unix timestamp in seconds
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
  const storedTokenJson = Cookies.get(CSRF_TOKEN_COOKIE)
  
  if (!storedTokenJson) {
    return false
  }
  
  try {
    const storedToken: CSRFToken = JSON.parse(storedTokenJson)
    
    // Check if token matches and hasn't expired
    const now = Math.floor(Date.now() / 1000)
    return storedToken.token === token && storedToken.expires > now
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
  Cookies.set(CSRF_TOKEN_COOKIE, JSON.stringify(csrfToken), {
    expires: new Date(csrfToken.expires * 1000), // Convert to milliseconds
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  })
}

/**
 * Retrieves the current CSRF token, generating a new one if needed
 * @param forceNew - Force generation of a new token regardless of current state
 * @returns CSRF token string
 */
export const getCSRFToken = (forceNew = false): string => {
  const storedTokenJson = Cookies.get(CSRF_TOKEN_COOKIE)
  
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
}

/**
 * Adds CSRF token header to fetch options
 * @param options - Fetch options object
 * @returns Modified fetch options with CSRF token header
 */
export const addCSRFToken = (options: RequestInit = {}): RequestInit => {
  const token = getCSRFToken()
  
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
  Cookies.remove(CSRF_TOKEN_COOKIE)
}

// Export constants for use in middleware and API routes
export { CSRF_TOKEN_COOKIE, CSRF_TOKEN_HEADER } 