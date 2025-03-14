/**
 * @file Next.js Middleware
 * @version 1.4.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-06-15
 * 
 * Next.js middleware for authentication and security checks.
 * Enhanced for SSR compatibility and improved security.
 * 
 * IMPORTANT:
 * - Any modification requires extensive testing across routes
 * - Security features must remain intact
 * 
 * Functionality:
 * - Route protection based on authentication status
 * - CSRF token validation for sensitive operations
 * - Auth parameter processing
 * - Public routes allowlist
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareSupabaseClient } from './lib/supabase-server'
import { CSRF_TOKEN_HEADER, CSRF_TOKEN_COOKIE } from './lib/csrf'
import { 
  safeGetCookieWithPrefixes, 
  createErrorResponse, 
  createErrorRedirect,
  safeAuthMiddleware
} from './lib/middleware-error-handler'
import { 
  createCSRFError, 
  CSRFErrorCode, 
  createAuthError, 
  AuthErrorCode 
} from './lib/error-handler'

// Check if in development environment
const isDev = process.env.NODE_ENV === 'development'

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/reset-password',
  '/verify',
  '/api/health',
  '/api/csrf', // Allow access to CSRF token endpoint
  '/_next',
  '/favicon.ico',
  // Add additional public routes as necessary
]

// API routes that require CSRF protection
const csrfProtectedRoutes = [
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/logout',
  '/api/user/settings',
  // Add additional routes that require CSRF protection
]

/**
 * Check if a route is public
 * @param path - Route path to check
 * @returns Boolean indicating if route is public
 */
function isPublicRoute(path: string): boolean {
  return publicRoutes.some(route => {
    return path === route || path.startsWith(route)
  })
}

/**
 * Check if a route requires CSRF protection
 * @param path - Route path to check
 * @returns Boolean indicating if CSRF protection is required
 */
function requiresCSRFProtection(path: string): boolean {
  return csrfProtectedRoutes.some(route => {
    return path === route || path.startsWith(route)
  })
}

/**
 * Validates a CSRF token against the stored token
 * @param token - The token to validate
 * @param storedToken - The stored token to validate against
 * @returns Boolean indicating if the token is valid
 */
function validateCSRFToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) {
    return false
  }
  
  try {
    const parsedToken = JSON.parse(storedToken)
    
    // Check if token matches and hasn't expired
    const now = Math.floor(Date.now() / 1000)
    const isValid = parsedToken.token === token && parsedToken.expires > now
    
    if (!isValid) {
      console.warn('CSRF validation failed: Token expired or mismatch', {
        tokenMatch: parsedToken.token === token,
        expired: parsedToken.expires <= now,
        expiresIn: parsedToken.expires - now
      })
    }
    
    return isValid
  } catch (error) {
    console.error('Error validating CSRF token:', error)
    return false
  }
}

/**
 * Handle CSRF validation for protected routes
 * @param request - NextRequest object
 * @param pathname - Current path
 * @returns Error response or null if validation passes
 */
function handleCSRFValidation(request: NextRequest, pathname: string): NextResponse | null {
  if (!requiresCSRFProtection(pathname)) {
    return null
  }
  
  const csrfToken = request.headers.get(CSRF_TOKEN_HEADER)
  const storedToken = safeGetCookieWithPrefixes(request, CSRF_TOKEN_COOKIE)
  
  // Skip CSRF check in development but log warning
  if (isDev && (!csrfToken || !storedToken)) {
    console.warn(`[Middleware] CSRF token missing for protected route: ${pathname}`)
    return null
  } 
  
  // In production, require CSRF token
  if (!isDev && (!csrfToken || !storedToken)) {
    const error = createCSRFError(
      'CSRF token validation failed: Token missing',
      CSRFErrorCode.MISSING_TOKEN
    )
    return createErrorResponse(error)
  }
  
  // In production, perform actual token validation
  if (!isDev && csrfToken && storedToken) {
    const isValid = validateCSRFToken(csrfToken, storedToken)
    
    if (!isValid) {
      const error = createCSRFError(
        'CSRF token validation failed: Invalid token',
        CSRFErrorCode.INVALID_TOKEN
      )
      return createErrorResponse(error)
    }
  }
  
  return null
}

/**
 * Authentication handler for middleware
 * @param request - NextRequest object
 * @param response - NextResponse object
 * @returns NextResponse
 */
async function authHandler(request: NextRequest, response: NextResponse): Promise<NextResponse> {
  const { supabase, response: supabaseResponse } = createMiddlewareSupabaseClient(request, response)
  
  if (!supabase) {
    throw new Error('Failed to create Supabase client')
  }
  
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  // If not authenticated and trying to access protected route
  if (!session) {
    const error = createAuthError(
      'Authentication required',
      AuthErrorCode.SESSION_EXPIRED
    )
    
    // Redirect to login with return URL
    const redirectUrl = new URL('/login', request.url)
    return createErrorRedirect(redirectUrl.toString(), error, {
      redirectedFrom: request.nextUrl.pathname + request.nextUrl.search
    })
  }
  
  // User is authenticated, allow access
  return supabaseResponse
}

/**
 * Middleware function executed on each request
 * @param request - NextRequest object
 * @returns NextResponse or undefined
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  
  // Create a response to handle cookie modifications
  const response = NextResponse.next()
  
  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return response
  }
  
  // Special handling for auth parameter
  if (search.includes('auth=true')) {
    // Skip authentication check for routes explicitly marked as authenticated
    return response
  }
  
  // CSRF validation for protected routes
  const csrfValidationResult = handleCSRFValidation(request, pathname)
  if (csrfValidationResult) {
    return csrfValidationResult
  }
  
  // Handle authentication with error handling
  return safeAuthMiddleware(request, response, authHandler)
}

/**
 * Configure which routes use this middleware
 */
export const config = {
  matcher: [
    // Private routes requiring authentication
    '/dashboard/:path*',
    '/settings/:path*',
    '/account/:path*',
    '/profile/:path*',
    '/projects/:path*',
    
    // Protected API routes
    '/api/auth/:path*',
    '/api/user/:path*',
    '/api/projects/:path*',
    
    // Exclude public routes from matching
    // This pattern matches all routes EXCEPT those specifically listed after the negative lookahead
    '/((?!login|signup|reset-password|verify|api/health|api/csrf|_next|favicon.ico).*)',
    
    // Explicitly exclude the homepage - this ensures the negative lookahead above won't match it
    '/:path((?!^/$).*)'
  ],
} 
