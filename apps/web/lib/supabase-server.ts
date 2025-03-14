/**
 * @file Server-side Supabase client
 * @version 1.1.0
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
import { type NextRequest, NextResponse } from 'next/server'

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
 * Only use within React Server Components or Route Handlers where cookies() is available
 * @returns Supabase client for server context
 */
export function createServerSupabaseClient() {
  try {
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
              console.warn('Error setting cookie in server component:', error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Handle cookies.delete error in middleware
              console.warn('Error removing cookie in server component:', error)
            }
          },
        },
      }
    )
  } catch (error) {
    console.error('Error creating server Supabase client:', error)
    throw error
  }
}

/**
 * Create a Supabase client for middleware
 * This version works in Edge runtime
 * @param request NextRequest object from middleware
 * @param response Optional NextResponse object to use instead of creating a new one
 * @returns Object with supabase client and response for cookie handling
 */
export function createMiddlewareSupabaseClient(request: NextRequest, response?: NextResponse) {
  // Create a response to collect cookies if not provided
  const resObj = response || NextResponse.next()
  
  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // This is needed for middleware to set cookies
            resObj.cookies.set({
              name,
              value,
              ...options
            })
          },
          remove(name: string, options: any) {
            // Delete cookies
            resObj.cookies.set({
              name,
              value: '',
              ...options,
              maxAge: 0
            })
          },
        },
      }
    )
    
    return { supabase, response: resObj }
  } catch (error) {
    console.error('Error creating middleware Supabase client:', error)
    return { supabase: null, response: resObj }
  }
}

/**
 * DO NOT USE THIS DIRECTLY in middleware
 * This is left for backward compatibility with server components only
 * Use createServerSupabaseClient() in RSC or createMiddlewareSupabaseClient(request) in middleware
 */
// export const serverSupabase = createServerSupabaseClient() // REMOVED as this causes issues in middleware 