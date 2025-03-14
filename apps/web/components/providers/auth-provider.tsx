'use client'

/**
 * @file Authentication provider component
 * @version 1.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-06-15
 * 
 * Provides authentication state management for the application.
 * Enhanced for SSR compatibility and better error handling.
 * 
 * IMPORTANT:
 * - Central auth state management
 * - Handles auth state changes
 * - Safe for SSR contexts
 * 
 * Functionality:
 * - Authentication state tracking
 * - User session management
 * - Loading state handling
 * - Error state tracking
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase-browser'

/**
 * Authentication context type
 */
export interface AuthContextType {
  session: Session | null
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

/**
 * Context default value
 */
const defaultContextValue: AuthContextType = {
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
}

/**
 * Create context for authentication
 */
const AuthContext = createContext<AuthContextType>(defaultContextValue)

/**
 * Check if we're in a browser environment
 */
const isBrowser = typeof window !== 'undefined'

/**
 * Provider for authentication state
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Handle auth state changes
  useEffect(() => {
    // Skip the effect entirely on the server
    if (!isBrowser) {
      console.log('AuthProvider: Running on server, skipping auth initialization')
      return
    }
    
    let mounted = true
    
    async function getSession() {
      try {
        if (!mounted) return
        setIsLoading(true)
        
        console.log('AuthProvider: Getting initial session')
        
        // Get current session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error fetching session:', sessionError.message)
          if (mounted) {
            setError(sessionError.message)
          }
          return
        }
        
        // Update state with session data if component is still mounted
        if (mounted) {
          console.log('AuthProvider: Session retrieved', { 
            hasSession: !!currentSession,
            user: currentSession?.user?.email
          })
          
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
          setError(null)
        }
      } catch (error) {
        console.error('Unexpected error fetching session:', error)
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Unknown error')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }
    
    // Initial session fetch
    getSession()
    
    // Subscribe to auth changes
    let authListener: { subscription: { unsubscribe: () => void } } | null = null
    
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log(`Auth state changed: ${event}`, {
            sessionExists: !!session,
            userEmail: session?.user?.email
          })
          
          if (mounted) {
            setSession(session)
            setUser(session?.user ?? null)
            setIsLoading(false)
          }
        }
      )
      
      authListener = data
    } catch (error) {
      console.error('Error setting up auth listener:', error)
      // Don't set error state here to avoid showing error to user
      // Just log it since the getSession call will still work
    }
    
    // Cleanup on unmount
    return () => {
      mounted = false
      if (authListener?.subscription) {
        try {
          authListener.subscription.unsubscribe()
        } catch (error) {
          console.error('Error unsubscribing from auth changes:', error)
        }
      }
    }
  }, [])
  
  const value = {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
    error,
  }
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access authentication context
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 