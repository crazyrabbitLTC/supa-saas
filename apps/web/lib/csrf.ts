'use client'

/**
 * @file CSRF protection utilities
 * @version 1.4.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-06-15
 * 
 * Provides functions for CSRF token generation, validation, and protection.
 * Enhanced to work with httpOnly cookies and server-side API.
 * 
 * IMPORTANT:
 * - Any modification to this file requires extensive testing
 * - Ensure all security implications are considered
 * - Safe to use in both client and server contexts
 * 
 * Functionality:
 * - Retrieval of CSRF tokens from server API
 * - Management of token rotation
 * - Adding CSRF tokens to requests
 */

import { v4 as uuidv4 } from 'uuid'

// Constants
export const CSRF_TOKEN_HEADER = 'X-CSRF-Token'
export const CSRF_TOKEN_COOKIE = 'csrfToken'

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined'

// In-memory token cache for client-side
let tokenCache: string | null = null;

/**
 * Fetches a CSRF token from the server API
 * @param forceNew - Force generation of a new token
 * @returns Promise with the token string
 */
export const fetchCSRFToken = async (forceNew = false): Promise<string> => {
  try {
    // If we have a cached token and don't need a new one, return it
    if (tokenCache && !forceNew) {
      return tokenCache;
    }

    // Fetch a new token from the server
    const response = await fetch('/api/csrf', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Include credentials to ensure cookies are sent/received
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.token) {
      throw new Error('Invalid response from CSRF token endpoint');
    }

    // Cache the token
    tokenCache = data.token;
    return data.token;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    // Return a fallback token in case of error
    // This is not ideal but prevents the application from breaking
    const fallbackToken = uuidv4();
    tokenCache = fallbackToken;
    return fallbackToken;
  }
};

/**
 * Validates a CSRF token against the server
 * @param token - The token to validate
 * @returns Promise with boolean indicating if the token is valid
 */
export const validateCSRFToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/csrf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
      credentials: 'same-origin',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error validating CSRF token:', error);
    return false;
  }
};

/**
 * Gets a CSRF token, fetching from the server if needed
 * @param forceNew - Force fetching a new token
 * @returns Promise with the token string
 */
export const getCSRFToken = async (forceNew = false): Promise<string> => {
  if (!isBrowser) {
    // In server context, return a placeholder
    // The actual token will be handled by the server-side API
    return 'SERVER_CONTEXT_TOKEN';
  }
  
  return fetchCSRFToken(forceNew);
};

/**
 * Adds CSRF token header to fetch options
 * @param options - Fetch options object
 * @returns Promise with modified fetch options with CSRF token header
 */
export const addCSRFToken = async (options: RequestInit = {}): Promise<RequestInit> => {
  // Only add token in browser context
  if (!isBrowser) {
    return options;
  }
  
  // Get token safely
  let token: string;
  try {
    token = await getCSRFToken();
  } catch (error) {
    console.warn('Error getting CSRF token for request:', error);
    // Generate a new token if there was an error
    token = uuidv4();
  }
  
  // Create headers if they don't exist
  const headers = options.headers || {};
  
  // Add the token to the headers
  return {
    ...options,
    headers: {
      ...headers,
      [CSRF_TOKEN_HEADER]: token,
    },
    // Always include credentials to ensure cookies are sent
    credentials: 'same-origin',
  };
};

/**
 * Clears the CSRF token cache, forcing a new token to be fetched
 */
export const clearCSRFToken = (): void => {
  tokenCache = null;
}; 