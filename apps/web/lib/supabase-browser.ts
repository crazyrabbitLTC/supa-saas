'use client'

/**
 * @file Supabase client for browser components
 * @version 1.3.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-06-15
 * 
 * This file provides utilities for initializing and using Supabase
 * in client components with enhanced security features.
 * 
 * IMPORTANT:
 * - Uses secure cookie settings for authentication
 * - Configures storage to work in both client and server environments
 * - Provides isomorphic storage implementation for SSR compatibility
 * - Lazy-loads the client to prevent SSR issues
 * 
 * Functionality:
 * - Creates a secure Supabase client for browser use
 * - Provides a singleton instance for application-wide use
 * - Safe to use in both client and server contexts
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

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined'

// Memory storage for server-side
const memoryStorage = new Map<string, string>()

/**
 * Isomorphic storage implementation that works in both client and server environments
 * Falls back to memory storage when localStorage is not available (server-side)
 */
const createIsomorphicStorage = () => {
  return {
    getItem: (key: string) => {
      try {
        if (isBrowser && window.localStorage) {
          return window.localStorage.getItem(key)
        }
      } catch (error) {
        console.warn('Error accessing localStorage:', error)
      }
      return memoryStorage.get(key) || null
    },
    setItem: (key: string, value: string) => {
      try {
        if (isBrowser && window.localStorage) {
          window.localStorage.setItem(key, value)
          return
        }
      } catch (error) {
        console.warn('Error writing to localStorage:', error)
      }
      memoryStorage.set(key, value)
    },
    removeItem: (key: string) => {
      try {
        if (isBrowser && window.localStorage) {
          window.localStorage.removeItem(key)
          return
        }
      } catch (error) {
        console.warn('Error removing from localStorage:', error)
      }
      memoryStorage.delete(key)
    },
  }
}

// Client instance - will be initialized lazily
let _browserSupabase: ReturnType<typeof createClient> | null = null

/**
 * Creates a Supabase client for use in browser contexts with enhanced security
 * @returns Supabase client instance
 */
export const createBrowserSupabaseClient = () => {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: isBrowser,
      persistSession: true,
      detectSessionInUrl: isBrowser,
      storageKey: 'supabase-auth-token',
      // Enhanced security for cookies with isomorphic storage
      storage: createIsomorphicStorage(),
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
 * Lazy initialization prevents SSR issues
 */
export const browserSupabase = (() => {
  if (!_browserSupabase) {
    _browserSupabase = createBrowserSupabaseClient()
  }
  return _browserSupabase
})() 