import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { CSRF_TOKEN_COOKIE, CSRF_TOKEN_HEADER } from './lib/csrf'

// List of operations that require CSRF validation
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH']
const CSRF_PROTECTED_ROUTES = [
  '/api/auth/logout',
  '/api/auth/password',
  '/api/user',
  '/api/profile',
  '/api/billing',
  '/api/settings',
]

// Helper to determine if a request requires CSRF protection
const requiresCSRFProtection = (request: NextRequest): boolean => {
  // Only validate CSRF for state-changing methods
  if (!CSRF_PROTECTED_METHODS.includes(request.method)) {
    return false
  }
  
  // Check if the path matches a protected route
  const path = request.nextUrl.pathname
  return CSRF_PROTECTED_ROUTES.some(route => path.startsWith(route))
}

// Helper to validate CSRF token in the request
const validateCSRFRequest = (request: NextRequest): boolean => {
  // Get the CSRF token from the request header
  const csrfToken = request.headers.get(CSRF_TOKEN_HEADER)
  if (!csrfToken) {
    return false
  }
  
  // Get the CSRF token from the cookie to compare
  const cookieHeader = request.headers.get('cookie') || ''
  const csrfCookieMatch = new RegExp(`${CSRF_TOKEN_COOKIE}=([^;]+)`).exec(cookieHeader)
  
  if (!csrfCookieMatch || csrfCookieMatch.length < 2) {
    return false
  }
  
  try {
    const csrfCookie = JSON.parse(decodeURIComponent(csrfCookieMatch[1]))
    
    // Validate the token and expiration
    const now = Math.floor(Date.now() / 1000)
    return csrfCookie.token === csrfToken && csrfCookie.expires > now
  } catch (error) {
    console.error('CSRF validation error:', error)
    return false
  }
}

export async function middleware(request: NextRequest) {
  const startTime = new Date().getTime()
  console.log(`Middleware: [${new Date().toISOString()}] Executing for path:`, request.nextUrl.pathname)
  
  // Log all cookies for debugging
  const cookieHeader = request.headers.get('cookie') || ''
  console.log(`Middleware: [${new Date().toISOString()}] Cookies present:`, cookieHeader.length > 0)
  
  // Create response early so we can modify it
  const res = NextResponse.next()
  
  // Add security headers to all responses
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-XSS-Protection', '1; mode=block')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Check CSRF token for protected operations
  if (requiresCSRFProtection(request)) {
    if (!validateCSRFRequest(request)) {
      console.error(`Middleware: [${new Date().toISOString()}] CSRF validation failed for ${request.method} ${request.nextUrl.pathname}`)
      
      // Return 403 Forbidden for invalid CSRF tokens
      return new NextResponse(
        JSON.stringify({ error: 'Invalid or missing CSRF token' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
    
    console.log(`Middleware: [${new Date().toISOString()}] CSRF validation passed for ${request.method} ${request.nextUrl.pathname}`)
  }
  
  // Extract the referer to understand where the request came from
  const referer = request.headers.get('referer') || 'unknown'
  console.log(`Middleware: [${new Date().toISOString()}] Request referer:`, referer)
  
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req: request, res })
  
  // Refresh session if expired - required for Server Components
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const endTime = new Date().getTime()
    
    console.log(`Middleware: [${new Date().toISOString()}] Session check completed in ${endTime - startTime}ms:`, { 
      path: request.nextUrl.pathname,
      hasSession: !!session,
      sessionUser: session?.user?.email,
      expires: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'none'
    })
    
    // Get the pathname from the URL
    const path = request.nextUrl.pathname
    
    // Check if the request is for a protected route (dashboard)
    const isProtectedRoute = path.startsWith('/dashboard')
    
    // Check if the request is for auth routes (login/signup)
    const isAuthRoute = path === '/login' || path === '/signup'
    
    // Check for special auth mode flag from the client
    const isAuthenticatedMode = request.nextUrl.searchParams.has('auth') || 
                              referer.includes('/login') || 
                              cookieHeader.includes('supabase-auth-token')
    
    // Special case for dashboard access after login (trust the client-side auth check)
    if (isProtectedRoute && isAuthenticatedMode) {
      console.log(`Middleware: [${new Date().toISOString()}] Auth mode detected, bypassing protection for:`, path)
      return res
    }
    
    // If trying to access dashboard without auth, redirect to homepage
    if (isProtectedRoute && !session) {
      console.log(`Middleware: [${new Date().toISOString()}] Redirecting unauthenticated user from dashboard to homepage`)
      const redirectUrl = new URL('/', request.url)
      return NextResponse.redirect(redirectUrl)
    }
    
    // If user is already authenticated and trying to access auth routes,
    // redirect them to the dashboard
    if (isAuthRoute && session) {
      console.log(`Middleware: [${new Date().toISOString()}] Redirecting authenticated user from auth page to dashboard`)
      const redirectUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }
    
    console.log(`Middleware: [${new Date().toISOString()}] Completed with no redirects for path:`, request.nextUrl.pathname)
    return res
  } catch (error) {
    // Handle errors in the session check
    console.error(`Middleware: [${new Date().toISOString()}] Error checking session:`, error)
    
    // If this is an API route that failed, return an error
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication error' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }
    
    // For page routes, allow the request to continue
    // The client-side auth provider will handle redirects if needed
    return res
  }
}

// Match all routes that should use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 