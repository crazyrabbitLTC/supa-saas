/**
 * @file Middleware Error Handler
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-06-15
 * 
 * Error handling utilities for Next.js middleware.
 * 
 * IMPORTANT:
 * - Any modification requires extensive testing
 * - Error handling must be consistent
 * 
 * Functionality:
 * - Safe cookie operations with error handling
 * - Graceful fallbacks for missing or invalid tokens
 * - Context checking before using cookies API
 * - Proper handling of edge cases
 */

import { NextRequest, NextResponse } from 'next/server'
import { logError, formatErrorResponse, AppError, AuthErrorCode, createAuthError } from './error-handler'

/**
 * Safely get a cookie value from a request
 * @param request - NextRequest object
 * @param name - Cookie name
 * @returns Cookie value or null if not found or error
 */
export function safeGetCookie(request: NextRequest, name: string): string | null {
  try {
    return request.cookies.get(name)?.value || null
  } catch (error) {
    logError(error, { context: 'safeGetCookie', cookieName: name })
    return null
  }
}

/**
 * Safely get multiple cookie values with prefixes
 * @param request - NextRequest object
 * @param name - Base cookie name
 * @param prefixes - Array of prefixes to try
 * @returns Cookie value or null if not found or error
 */
export function safeGetCookieWithPrefixes(
  request: NextRequest,
  name: string,
  prefixes: string[] = ['', '__Host-', '__Secure-']
): string | null {
  try {
    for (const prefix of prefixes) {
      const value = safeGetCookie(request, `${prefix}${name}`)
      if (value) {
        return value
      }
    }
    return null
  } catch (error) {
    logError(error, { context: 'safeGetCookieWithPrefixes', cookieName: name })
    return null
  }
}

/**
 * Safely set a cookie in a response
 * @param response - NextResponse object
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 * @returns Boolean indicating success
 */
export function safeSetCookie(
  response: NextResponse,
  name: string,
  value: string,
  options: Record<string, any> = {}
): boolean {
  try {
    response.cookies.set(name, value, options)
    return true
  } catch (error) {
    logError(error, { context: 'safeSetCookie', cookieName: name })
    return false
  }
}

/**
 * Safely delete a cookie from a response
 * @param response - NextResponse object
 * @param name - Cookie name
 * @returns Boolean indicating success
 */
export function safeDeleteCookie(response: NextResponse, name: string): boolean {
  try {
    response.cookies.delete(name)
    return true
  } catch (error) {
    logError(error, { context: 'safeDeleteCookie', cookieName: name })
    return false
  }
}

/**
 * Create a redirect response with error parameters
 * @param url - Base URL to redirect to
 * @param error - Error object or code
 * @param redirectParams - Additional redirect parameters
 * @returns NextResponse redirect
 */
export function createErrorRedirect(
  url: string,
  error: AppError | AuthErrorCode,
  redirectParams: Record<string, string> = {}
): NextResponse {
  try {
    const redirectUrl = new URL(url)
    
    // Add error information to URL
    if (error instanceof AppError) {
      redirectUrl.searchParams.set('error', error.code)
      redirectUrl.searchParams.set('error_description', error.message)
    } else {
      redirectUrl.searchParams.set('error', error)
    }
    
    // Add additional parameters
    for (const [key, value] of Object.entries(redirectParams)) {
      redirectUrl.searchParams.set(key, value)
    }
    
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    logError(error, { context: 'createErrorRedirect', url })
    
    // Fallback to simple redirect without parameters
    return NextResponse.redirect(url)
  }
}

/**
 * Create an error response for middleware
 * @param error - Error object
 * @param status - HTTP status code
 * @returns NextResponse with error
 */
export function createErrorResponse(error: unknown, status = 500): NextResponse {
  try {
    const errorResponse = formatErrorResponse(error)
    return NextResponse.json(errorResponse, { status: errorResponse.error.status || status })
  } catch (e) {
    logError(e, { context: 'createErrorResponse', originalError: error })
    
    // Fallback to generic error
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'An unknown error occurred',
          code: 'UNKNOWN_ERROR',
          status: 500,
        },
      },
      { status: 500 }
    )
  }
}

/**
 * Safely handle authentication in middleware
 * @param request - NextRequest object
 * @param response - NextResponse object
 * @param authHandler - Authentication handler function
 * @returns NextResponse
 */
export async function safeAuthMiddleware(
  request: NextRequest,
  response: NextResponse,
  authHandler: (req: NextRequest, res: NextResponse) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await authHandler(request, response)
  } catch (error) {
    logError(error, { context: 'safeAuthMiddleware', url: request.url })
    
    // Create authentication error
    const authError = createAuthError(
      'Authentication failed',
      AuthErrorCode.SESSION_EXPIRED,
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    )
    
    // Redirect to login with error
    const loginUrl = new URL('/login', request.url)
    return createErrorRedirect(loginUrl.toString(), authError, {
      redirectedFrom: request.nextUrl.pathname + request.nextUrl.search,
    })
  }
}

/**
 * Check if cookies API is available in the current context
 * @returns Boolean indicating if cookies API is available
 */
export function isCookiesApiAvailable(): boolean {
  try {
    // Attempt to access cookies API
    const response = new NextResponse()
    response.cookies.set('test', 'test')
    response.cookies.delete('test')
    return true
  } catch (error) {
    return false
  }
}
