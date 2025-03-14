import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  console.log("Middleware executing for path:", request.nextUrl.pathname)
  
  // Skip middleware for specific navigation targets
  // This prevents interference with login redirections
  const url = request.nextUrl
  if (url.searchParams.has('authRedirect')) {
    console.log("Skipping middleware for auth redirect")
    return NextResponse.next()
  }
  
  const res = NextResponse.next()
  
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req: request, res })
  
  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()
  console.log("Middleware session check:", { 
    path: request.nextUrl.pathname,
    hasSession: !!session,
    sessionUser: session?.user?.email 
  })
  
  // Get the pathname from the URL
  const path = request.nextUrl.pathname
  
  // Check if the request is for a protected route (dashboard)
  const isProtectedRoute = path.startsWith('/dashboard')
  
  // Check if the request is for auth routes (login/signup)
  const isAuthRoute = path === '/login' || path === '/signup'
  
  // If trying to access dashboard without auth, redirect to homepage
  if (isProtectedRoute && !session) {
    console.log("Middleware redirecting unauthenticated user from dashboard to homepage")
    const redirectUrl = new URL('/', request.url)
    return NextResponse.redirect(redirectUrl)
  }
  
  // If user is already authenticated and trying to access auth routes,
  // redirect them to the dashboard
  if (isAuthRoute && session) {
    console.log("Middleware redirecting authenticated user from auth page to dashboard")
    const redirectUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(redirectUrl)
  }
  
  console.log("Middleware completed with no redirects for path:", request.nextUrl.pathname)
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