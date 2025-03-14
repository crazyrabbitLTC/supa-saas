'use client'

/**
 * @file Authentication provider component
 * @version 1.0.0
 * 
 * Provides authentication state management for the application.
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
 * Provider for authentication state
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Handle auth state changes
  useEffect(() => {
    let mounted = true
    
    async function getSession() {
      try {
        setIsLoading(true)
        
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
    const { data: authListener } = supabase.auth.onAuthStateChange(
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
    
    // Cleanup on unmount
    return () => {
      mounted = false
      authListener?.subscription.unsubscribe()
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