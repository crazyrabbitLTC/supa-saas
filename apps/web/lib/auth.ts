'use client'

/**
 * @file Authentication service
 * @version 1.2.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-06-15
 * 
 * Provides functions for handling authentication operations like signup, login, logout,
 * and session management using Supabase Auth with added security features.
 * Enhanced to work in both client and server environments.
 * 
 * IMPORTANT:
 * - Includes CSRF protection for auth operations
 * - Implements secure cookie handling
 * - Adds basic rate limiting tracking
 * - Safe to use in both client and server contexts
 * 
 * Functionality:
 * - User signup with metadata
 * - User login with security measures
 * - Secure logout process
 * - Session management
 * - Isomorphic implementation (works in SSR)
 */

import { createBrowserSupabaseClient, browserSupabase } from './supabase-browser'
import { getCSRFToken, clearCSRFToken } from './csrf'
import Cookies from 'js-cookie'

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined'

// Types for authentication operations
type SignUpCredentials = {
  firstName: string
  lastName: string
  email: string
  password: string
}

type SignUpResponse = {
  success: boolean
  error?: string
}

type LoginCredentials = {
  email: string
  password: string
}

type LoginResponse = {
  success: boolean
  error?: string
}

// Rate limiting implementation
const RATE_LIMIT_COOKIE = 'auth_attempts'
const MAX_AUTH_ATTEMPTS = 5
const RATE_LIMIT_WINDOW = 60 * 15 // 15 minutes in seconds

interface RateLimitData {
  count: number
  resetAt: number // Unix timestamp
}

// Server-side storage for rate limiting
const serverRateLimitStorage = new Map<string, string>()

/**
 * Gets a cookie value in an isomorphic way (works in both browser and server)
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
const getCookie = (name: string): string | null => {
  if (isBrowser) {
    return Cookies.get(name) || null
  }
  return serverRateLimitStorage.get(name) || null
}

/**
 * Sets a cookie value in an isomorphic way
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Cookie options
 */
const setCookie = (
  name: string, 
  value: string, 
  options?: Cookies.CookieAttributes
): void => {
  if (isBrowser) {
    Cookies.set(name, value, options)
  } else {
    serverRateLimitStorage.set(name, value)
  }
}

/**
 * Removes a cookie in an isomorphic way
 * @param name - Cookie name
 */
const removeCookie = (name: string): void => {
  if (isBrowser) {
    Cookies.remove(name)
  } else {
    serverRateLimitStorage.delete(name)
  }
}

/**
 * Checks if the current client is rate limited for auth attempts
 * @returns Boolean indicating if rate limited, and seconds until reset if limited
 */
const isRateLimited = (): { limited: boolean; resetIn?: number } => {
  // Skip rate limiting on the server
  if (!isBrowser) {
    return { limited: false }
  }
  
  const rateLimitJson = getCookie(RATE_LIMIT_COOKIE)
  
  if (!rateLimitJson) {
    return { limited: false }
  }
  
  try {
    const rateLimit: RateLimitData = JSON.parse(rateLimitJson)
    const now = Math.floor(Date.now() / 1000)
    
    // If the rate limit window has expired, reset the counter
    if (rateLimit.resetAt <= now) {
      removeCookie(RATE_LIMIT_COOKIE)
      return { limited: false }
    }
    
    // Check if we've exceeded the allowed attempts
    if (rateLimit.count >= MAX_AUTH_ATTEMPTS) {
      return { 
        limited: true, 
        resetIn: rateLimit.resetAt - now 
      }
    }
    
    return { limited: false }
  } catch (error) {
    console.error('Error checking rate limit:', error)
    return { limited: false }
  }
}

/**
 * Records an authentication attempt for rate limiting
 */
const recordAuthAttempt = (): void => {
  // Skip rate limiting on the server
  if (!isBrowser) {
    return
  }
  
  const rateLimitJson = getCookie(RATE_LIMIT_COOKIE)
  const now = Math.floor(Date.now() / 1000)
  
  let rateLimit: RateLimitData
  
  if (!rateLimitJson) {
    // Initialize rate limit data
    rateLimit = {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    }
  } else {
    try {
      rateLimit = JSON.parse(rateLimitJson)
      
      // Reset if window has expired
      if (rateLimit.resetAt <= now) {
        rateLimit = {
          count: 1,
          resetAt: now + RATE_LIMIT_WINDOW,
        }
      } else {
        // Increment attempt counter
        rateLimit.count += 1
      }
    } catch (error) {
      console.error('Error parsing rate limit data:', error)
      rateLimit = {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW,
      }
    }
  }
  
  // Store updated rate limit data
  setCookie(RATE_LIMIT_COOKIE, JSON.stringify(rateLimit), {
    expires: new Date(rateLimit.resetAt * 1000), // Convert to milliseconds
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  })
}

/**
 * Reset the rate limit counter (used after successful auth)
 */
const resetRateLimit = (): void => {
  // Skip rate limiting on the server
  if (!isBrowser) {
    return
  }
  
  removeCookie(RATE_LIMIT_COOKIE)
}

/**
 * AuthService provides methods for interacting with Supabase Auth
 * with added security features
 */
export const AuthService = {
  /**
   * Sign up a new user
   * @param credentials - User signup credentials
   * @returns Response with success flag and optional error
   */
  async signUp({
    firstName,
    lastName,
    email,
    password,
  }: SignUpCredentials): Promise<SignUpResponse> {
    try {
      // Skip security checks on server-side
      if (isBrowser) {
        // Rate limiting check
        const rateLimited = isRateLimited()
        if (rateLimited.limited) {
          return {
            success: false,
            error: `Too many authentication attempts. Please try again in ${Math.ceil(rateLimited.resetIn! / 60)} minutes.`,
          }
        }
        
        // Record this attempt
        recordAuthAttempt()
        
        // Generate a CSRF token for this operation
        getCSRFToken(true) // Force a new token
      }
      
      const supabase = browserSupabase
      
      // Register user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Store user metadata (will be accessible in RLS policies)
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
          },
        },
      })

      if (error) {
        console.error('Signup error:', error.message)
        return {
          success: false,
          error: error.message,
        }
      }

      // Check if user was created successfully
      if (!data.user) {
        return {
          success: false,
          error: 'User creation failed',
        }
      }

      // Reset rate limiting on success (client-side only)
      if (isBrowser) {
        resetRateLimit()
      }
      
      return { success: true }
    } catch (error) {
      console.error('Unexpected signup error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred during signup',
      }
    }
  },

  /**
   * Log in an existing user
   * @param credentials - User login credentials
   * @returns Response with success flag and optional error
   */
  async login({
    email,
    password,
  }: LoginCredentials): Promise<LoginResponse> {
    console.log(`AuthService.login: [${new Date().toISOString()}] Attempting login`, { email })
    try {
      // Skip security checks on server-side
      if (isBrowser) {
        // Rate limiting check
        const rateLimited = isRateLimited()
        if (rateLimited.limited) {
          return {
            success: false,
            error: `Too many authentication attempts. Please try again in ${Math.ceil(rateLimited.resetIn! / 60)} minutes.`,
          }
        }
        
        // Record this attempt
        recordAuthAttempt()
        
        // Generate a CSRF token for this operation
        getCSRFToken(true) // Force a new token
      }
      
      const supabase = browserSupabase
      
      const startTime = new Date().getTime()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      const endTime = new Date().getTime()
      
      console.log(`AuthService.login: [${new Date().toISOString()}] Supabase auth call completed in ${endTime - startTime}ms`)

      if (error) {
        console.error("AuthService.login: Login error from Supabase", { error: error.message })
        return {
          success: false,
          error: error.message,
        }
      }

      if (!data.user) {
        console.error("AuthService.login: No user returned from successful auth")
        return {
          success: false,
          error: 'Login failed',
        }
      }

      // Reset rate limiting on success (client-side only)
      if (isBrowser) {
        resetRateLimit()
      }
      
      // Add a small delay to ensure cookies are set (client-side only)
      if (isBrowser) {
        console.log(`AuthService.login: [${new Date().toISOString()}] Login successful, waiting for session to be established...`)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      // Verify session immediately after login
      const sessionCheck = await this.getSession()
      console.log(`AuthService.login: [${new Date().toISOString()}] Session check after login:`, { 
        hasSession: !!sessionCheck,
        sessionUser: sessionCheck?.user?.email,
        sessionExpiry: sessionCheck?.expires_at
      })

      console.log(`AuthService.login: [${new Date().toISOString()}] Login successful`, { 
        userId: data.user.id,
        email: data.user.email,
        sessionExpires: data.session?.expires_at
      })
      return { success: true }
    } catch (error) {
      console.error('AuthService.login: Unexpected login error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred during login',
      }
    }
  },

  /**
   * Log out the current user
   * @returns Response with success flag and optional error
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      // Get a CSRF token to protect this operation (client-side only)
      if (isBrowser) {
        getCSRFToken(true) // Force a new token
      }
      
      const supabase = browserSupabase
      
      const { error } = await supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      // Clear any security tokens after logout (client-side only)
      if (isBrowser) {
        clearCSRFToken()
        resetRateLimit()
      }
      
      return { success: true }
    } catch (error) {
      console.error('Unexpected logout error:', error)
      return {
        success: false,
        error: 'An unexpected error occurred during logout',
      }
    }
  },

  /**
   * Get the current session
   * @returns The current session or null if not authenticated
   */
  async getSession() {
    try {
      const supabase = browserSupabase
      
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Session error:', error.message)
        return null
      }

      return data.session
    } catch (error) {
      console.error('Unexpected session error:', error)
      return null
    }
  },
} 