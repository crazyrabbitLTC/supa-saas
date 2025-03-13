/**
 * @file Authentication service
 * @version 1.0.0
 * 
 * Provides functions for handling authentication operations like signup, login, logout,
 * and session management using Supabase Auth.
 */

import { createBrowserSupabaseClient } from './supabase'

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
      const supabase = createBrowserSupabaseClient()
      
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
    try {
      const supabase = createBrowserSupabaseClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return {
          success: false,
          error: error.message,
        }
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Login failed',
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected login error:', error)
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
      const supabase = createBrowserSupabaseClient()
      
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
      const supabase = createBrowserSupabaseClient()
      
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