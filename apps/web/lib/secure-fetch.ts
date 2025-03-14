'use client'

/**
 * @file Secure Fetch Utility
 * @version 1.2.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-06-15
 * 
 * Provides enhanced fetch functions with security features:
 * - CSRF protection
 * - Consistent error handling
 * - Type safety
 * - SSR compatibility
 * 
 * IMPORTANT:
 * - Any modification requires testing in both client and server contexts
 * - Ensure security features remain intact
 * 
 * Functionality:
 * - Type-safe API requests
 * - CSRF protection
 * - Error handling with consistent response format
 * - Works in both browser and server contexts
 */

import { addCSRFToken } from './csrf'

// Check if in browser environment
const isBrowser = typeof window !== 'undefined'

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    status?: number
  }
}

/**
 * Enhanced fetch function with security features
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Promise with response
 */
export async function secureFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Only add CSRF token in browser context
    const secureOptions = isBrowser ? addCSRFToken(options) : options

    // Set default headers
    secureOptions.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...secureOptions.headers,
    }

    const response = await fetch(url, secureOptions)
    
    // Try to parse JSON response
    let data
    try {
      data = await response.json()
    } catch (e) {
      if (response.ok && response.status === 204) {
        // No content is ok
        data = null
      } else {
        throw new Error(`Failed to parse JSON response: ${(e as Error).message}`)
      }
    }

    // Check if the response is successful
    if (!response.ok) {
      return {
        success: false,
        error: {
          message: data?.message || data?.error || 'An unknown error occurred',
          code: data?.code,
          status: response.status,
        },
      }
    }

    // Return successful response
    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Secure fetch error:', error)
    return {
      success: false,
      error: {
        message: (error as Error).message || 'Network error occurred',
        code: 'NETWORK_ERROR',
      },
    }
  }
}

/**
 * Enhanced GET request with security features
 * @param url - URL to fetch
 * @param options - Additional fetch options
 * @returns Promise with typed response
 */
export async function secureGet<T = any>(
  url: string,
  options: Omit<RequestInit, 'method'> = {}
): Promise<ApiResponse<T>> {
  return secureFetch<T>(url, {
    ...options,
    method: 'GET',
  })
}

/**
 * Enhanced POST request with security features
 * @param url - URL to fetch
 * @param body - Request body
 * @param options - Additional fetch options
 * @returns Promise with typed response
 */
export async function securePost<T = any, B = any>(
  url: string,
  body?: B,
  options: Omit<RequestInit, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  return secureFetch<T>(url, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * Enhanced PUT request with security features
 * @param url - URL to fetch
 * @param body - Request body
 * @param options - Additional fetch options
 * @returns Promise with typed response
 */
export async function securePut<T = any, B = any>(
  url: string,
  body?: B,
  options: Omit<RequestInit, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  return secureFetch<T>(url, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * Enhanced PATCH request with security features
 * @param url - URL to fetch
 * @param body - Request body
 * @param options - Additional fetch options
 * @returns Promise with typed response
 */
export async function securePatch<T = any, B = any>(
  url: string,
  body?: B,
  options: Omit<RequestInit, 'method' | 'body'> = {}
): Promise<ApiResponse<T>> {
  return secureFetch<T>(url, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * Enhanced DELETE request with security features
 * @param url - URL to fetch
 * @param options - Additional fetch options
 * @returns Promise with typed response
 */
export async function secureDelete<T = any>(
  url: string,
  options: Omit<RequestInit, 'method'> = {}
): Promise<ApiResponse<T>> {
  return secureFetch<T>(url, {
    ...options,
    method: 'DELETE',
  })
} 