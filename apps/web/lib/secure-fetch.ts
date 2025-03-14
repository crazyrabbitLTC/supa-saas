'use client'

/**
 * @file Secure fetch utility
 * @version 1.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-06-15
 * 
 * Provides a secure fetch utility that automatically adds CSRF tokens
 * to API requests to protect against CSRF attacks.
 * Enhanced to work in both client and server environments.
 * 
 * IMPORTANT:
 * - Use this instead of native fetch for all API calls that modify data
 * - Ensures CSRF token is included in the request headers
 * - Safe to use in both client and server contexts
 * 
 * Functionality:
 * - Automatic CSRF token inclusion
 * - Type-safe response handling
 * - Error handling with standardized format
 * - Isomorphic implementation (works in SSR)
 */

import { addCSRFToken } from './csrf'

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined'

// Type for standardized API error responses
export interface ApiError {
  message: string
  code?: string
  details?: any
}

/**
 * Options for the secureFetch function
 */
export interface SecureFetchOptions extends RequestInit {
  skipCSRF?: boolean
}

/**
 * Securely fetch data from an API endpoint with automatic CSRF token handling
 * @param url - The URL to fetch from
 * @param options - Fetch options including skipCSRF to bypass CSRF token
 * @returns Promise resolving to the JSON response data
 * @throws Error with API error details when request fails
 */
export async function secureFetch<T = any>(
  url: string,
  options: SecureFetchOptions = {}
): Promise<T> {
  const { skipCSRF = false, ...fetchOptions } = options
  
  // Only add CSRF token if not skipped and in browser context
  const finalOptions = (skipCSRF || !isBrowser) 
    ? fetchOptions
    : addCSRFToken(fetchOptions)
  
  try {
    const response = await fetch(url, finalOptions)
    
    // Handle non-success responses
    if (!response.ok) {
      let errorData: ApiError = {
        message: `API request failed with status ${response.status}`,
      }
      
      // Try to parse error response as JSON
      try {
        const errorJson = await response.json()
        errorData = {
          ...errorData,
          ...errorJson,
        }
      } catch {
        // If error response is not valid JSON, just use status text
        errorData.message = response.statusText || errorData.message
      }
      
      throw new Error(errorData.message, { cause: errorData })
    }
    
    // Check if response is empty
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json() as T
    }
    
    // Return empty object for non-JSON responses
    return {} as T
  } catch (error) {
    // Rethrow errors from the fetch operation
    if (error instanceof Error) {
      throw error
    }
    
    // Handle unexpected errors
    throw new Error('An unexpected error occurred during the API request', {
      cause: error,
    })
  }
}

/**
 * Secure GET request with automatic CSRF token handling
 * @param url - The URL to fetch from
 * @param options - Additional fetch options
 * @returns Promise resolving to the JSON response data
 */
export function secureGet<T = any>(
  url: string,
  options: SecureFetchOptions = {}
): Promise<T> {
  return secureFetch<T>(url, {
    method: 'GET',
    ...options,
    // GET requests typically don't need CSRF protection
    skipCSRF: options.skipCSRF !== false,
  })
}

/**
 * Secure POST request with automatic CSRF token handling
 * @param url - The URL to post to
 * @param data - The data to send in the request body
 * @param options - Additional fetch options
 * @returns Promise resolving to the JSON response data
 */
export function securePost<T = any>(
  url: string,
  data?: any,
  options: SecureFetchOptions = {}
): Promise<T> {
  return secureFetch<T>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...options,
    // Skip CSRF token in server context
    skipCSRF: !isBrowser || options.skipCSRF === true,
  })
}

/**
 * Secure PUT request with automatic CSRF token handling
 * @param url - The URL to put to
 * @param data - The data to send in the request body
 * @param options - Additional fetch options
 * @returns Promise resolving to the JSON response data
 */
export function securePut<T = any>(
  url: string,
  data?: any,
  options: SecureFetchOptions = {}
): Promise<T> {
  return secureFetch<T>(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...options,
    // Skip CSRF token in server context
    skipCSRF: !isBrowser || options.skipCSRF === true,
  })
}

/**
 * Secure DELETE request with automatic CSRF token handling
 * @param url - The URL to delete from
 * @param options - Additional fetch options
 * @returns Promise resolving to the JSON response data
 */
export function secureDelete<T = any>(
  url: string,
  options: SecureFetchOptions = {}
): Promise<T> {
  return secureFetch<T>(url, {
    method: 'DELETE',
    ...options,
    // Skip CSRF token in server context
    skipCSRF: !isBrowser || options.skipCSRF === true,
  })
}

/**
 * Secure PATCH request with automatic CSRF token handling
 * @param url - The URL to patch
 * @param data - The data to send in the request body
 * @param options - Additional fetch options
 * @returns Promise resolving to the JSON response data
 */
export function securePatch<T = any>(
  url: string,
  data?: any,
  options: SecureFetchOptions = {}
): Promise<T> {
  return secureFetch<T>(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...options,
    // Skip CSRF token in server context
    skipCSRF: !isBrowser || options.skipCSRF === true,
  })
} 