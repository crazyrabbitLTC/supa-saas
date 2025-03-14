'use client'

/**
 * @file Authentication service
 * @version 1.0.0
 * 
 * Provides functions for handling authentication operations like signup, login, logout,
 * and session management using Supabase Auth.
 */

import { createBrowserSupabaseClient, browserSupabase } from './supabase-browser'

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

/**
 * AuthService provides methods for interacting with Supabase Auth
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

      // Add a small delay to ensure cookies are set
      console.log(`AuthService.login: [${new Date().toISOString()}] Login successful, waiting for session to be established...`)
      await new Promise(resolve => setTimeout(resolve, 500))
      
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
      const supabase = browserSupabase
      
      const { error } = await supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          error: error.message,
        }
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