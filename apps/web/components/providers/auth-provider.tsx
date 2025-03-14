'use client'

/**
 * @file Authentication provider component
 * @version 1.0.0
 * 
 * Provides authentication state management for the application.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthService } from '@/lib/auth'
import { Session, User } from '@supabase/supabase-js'
import { browserSupabase } from '@/lib/supabase-browser'

type AuthContextType = {
  session: Session | null
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
})

export const useAuth = () => useContext(AuthContext)

/**
 * Provider component for authentication state
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch the current session when the component mounts
    const fetchSession = async () => {
      console.log("AuthProvider: Fetching initial session")
      try {
        const currentSession = await AuthService.getSession()
        console.log("AuthProvider: Initial session result", { 
          hasSession: !!currentSession,
          user: currentSession?.user?.email
        })
        setSession(currentSession)
        setUser(currentSession?.user || null)
      } catch (error) {
        console.error('Error fetching session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Listen for authentication state changes
    const { data: { subscription } } = browserSupabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("AuthProvider: Auth state changed", { event, user: currentSession?.user?.email })
        
        setSession(currentSession)
        setUser(currentSession?.user || null)
        setIsLoading(false)
      }
    )

    fetchSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 