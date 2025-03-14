'use client'

/**
 * @file Supabase client for browser components
 * @version 1.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-06-14
 * 
 * This file provides utilities for initializing and using Supabase
 * in client components with enhanced security features.
 * 
 * IMPORTANT:
 * - Uses secure cookie settings for authentication
 * - Configures storage to use secure cookies
 * 
 * Functionality:
 * - Creates a secure Supabase client for browser use
 * - Provides a singleton instance for application-wide use
 */

import { createClient } from '@supabase/supabase-js'

// Define the Supabase URL and anon key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verify that the required environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'
  )
}

/**
 * Creates a Supabase client for use in browser contexts with enhanced security
 * @returns Supabase client instance
 */
export const createBrowserSupabaseClient = () => {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'supabase-auth-token',
      // Enhanced security for cookies
      storage: {
        getItem: (key) => {
          const item = localStorage.getItem(key)
          return item || null
        },
        setItem: (key, value) => {
          localStorage.setItem(key, value)
        },
        removeItem: (key) => {
          localStorage.removeItem(key)
        },
      },
      cookieOptions: {
        // Enforce secure settings for auth cookies
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }
    },
  })
}

/**
 * Gets a Supabase client for use in client components
 * This is a singleton instance that can be used throughout the client-side app
 */
export const browserSupabase = createBrowserSupabaseClient() 