/**
 * @file Server-side Supabase client
 * @version 1.0.1
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-06-15
 * 
 * Provides a Supabase client for server contexts (middleware, server components).
 * Uses cookies instead of localStorage for session management.
 * 
 * IMPORTANT:
 * - Only use this in server contexts
 * - Any modification requires extensive testing
 * - Never import from client components
 * 
 * Functionality:
 * - Secure server-side authentication
 * - Cookie-based session storage
 * - Middleware integration
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type NextRequest } from 'next/server'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  )
}

/**
 * Create a Supabase client for server components
 * @returns Supabase client for server context
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookies.set error in middleware
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookies.delete error in middleware
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase client for middleware
 * This version works in Edge runtime
 * @param request NextRequest object from middleware
 * @returns Supabase client configured for middleware
 */
export function createMiddlewareSupabaseClient(request: NextRequest) {
  // Create an empty response to collect cookies
  let response = new Response(null)
  
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // This is needed for middleware to set cookies
          response.headers.append('Set-Cookie', 
            `${name}=${value}; Path=${options.path || '/'}; ${options.secure ? 'Secure; ' : ''}${
              options.sameSite ? `SameSite=${options.sameSite}; ` : ''
            }${options.maxAge ? `Max-Age=${options.maxAge}; ` : ''}${
              options.domain ? `Domain=${options.domain}; ` : ''
            }${options.httpOnly ? 'HttpOnly; ' : ''}`
          )
        },
        remove(name: string, options: any) {
          // Delete cookies by setting an expired date
          response.headers.append('Set-Cookie', 
            `${name}=; Path=${options.path || '/'}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${
              options.secure ? 'Secure; ' : ''
            }${options.sameSite ? `SameSite=${options.sameSite}; ` : ''}${
              options.domain ? `Domain=${options.domain}; ` : ''
            }${options.httpOnly ? 'HttpOnly; ' : ''}`
          )
        },
      },
    }
  )
}

/**
 * Return a pre-configured server-side Supabase instance
 */
export const serverSupabase = createServerSupabaseClient() 