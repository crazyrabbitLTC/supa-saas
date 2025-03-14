'use client'

/**
 * @file Supabase client for browser components
 * @version 1.4.0
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
    getKey: (index: number): string | null => {
      try {
        if (isBrowser && window.localStorage) {
          return window.localStorage.key(index)
        }
      } catch (error) {
        console.warn('Error accessing localStorage keys:', error)
      }
      return Array.from(memoryStorage.keys())[index] || null
    },
    get length(): number {
      try {
        if (isBrowser && window.localStorage) {
          return window.localStorage.length
        }
      } catch (error) {
        console.warn('Error accessing localStorage length:', error)
      }
      return memoryStorage.size
    },
    // Add these methods to fully implement the Storage interface
    key: function(index: number): string | null {
      return this.getKey(index)
    },
    clear: function(): void {
      try {
        if (isBrowser && window.localStorage) {
          window.localStorage.clear()
          return
        }
      } catch (error) {
        console.warn('Error clearing localStorage:', error)
      }
      memoryStorage.clear()
    }
  }
}

// Wait for window to be defined before creating the client
let _supabase: ReturnType<typeof createClient> | null = null

/**
 * Creates a Supabase client for use in browser contexts with enhanced security
 * @returns Supabase client instance
 */
export const createBrowserSupabaseClient = () => {
  if (!isBrowser) {
    // For SSR, return a dummy client that will be replaced on client-side
    return createEmptyClient()
  }
  
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
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
 * Create an empty client for SSR that won't try to access localStorage
 * This will be replaced on the client side
 */
const createEmptyClient = () => {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storage: createIsomorphicStorage(),
    },
  })
}

/**
 * Gets a Supabase client for use in client components
 * This is a singleton instance that can be used throughout the client-side app
 * Lazy initialization prevents SSR issues
 */
export const supabase = (() => {
  // Only create the client when it's being accessed
  if (isBrowser && !_supabase) {
    _supabase = createBrowserSupabaseClient()
  } else if (!_supabase) {
    // For SSR, create a non-localStorage dependent client
    _supabase = createEmptyClient()
  }
  return _supabase
})()

// Export for backwards compatibility
export const browserSupabase = supabase 