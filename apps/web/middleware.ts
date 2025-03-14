import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  const startTime = new Date().getTime()
  console.log(`Middleware: [${new Date().toISOString()}] Executing for path:`, request.nextUrl.pathname)
  const res = NextResponse.next()
  
  // Extract the referer to understand where the request came from
  const referer = request.headers.get('referer') || 'unknown'
  console.log(`Middleware: [${new Date().toISOString()}] Request referer:`, referer)
  
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req: request, res })
  
  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()
  const endTime = new Date().getTime()
  
  console.log(`Middleware: [${new Date().toISOString()}] Session check completed in ${endTime - startTime}ms:`, { 
    path: request.nextUrl.pathname,
    hasSession: !!session,
    sessionUser: session?.user?.email,
    expires: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'none'
  })
  
  // Special case: if this is a request immediately after login, skip redirection
  const isPostLoginRequest = referer.includes('/login') && request.nextUrl.pathname === '/dashboard'
  if (isPostLoginRequest) {
    console.log(`Middleware: [${new Date().toISOString()}] Post-login request detected, allowing navigation to dashboard`)
    return res
  }
  
  // Get the pathname from the URL
  const path = request.nextUrl.pathname
  
  // Check if the request is for a protected route (dashboard)
  const isProtectedRoute = path.startsWith('/dashboard')
  
  // Check if the request is for auth routes (login/signup)
  const isAuthRoute = path === '/login' || path === '/signup'
  
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