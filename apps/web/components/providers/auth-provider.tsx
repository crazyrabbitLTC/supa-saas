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
      try {
        const currentSession = await AuthService.getSession()
        setSession(currentSession)
        setUser(currentSession?.user || null)
      } catch (error) {
        console.error('Error fetching session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()

    // Subscribe to auth state changes
    const { browserSupabase } = require('@/lib/supabase-browser')
    
    const {
      data: { subscription },
    } = browserSupabase.auth.onAuthStateChange((event, newSession) => {
      console.log('Auth state changed:', event)
      setSession(newSession)
      setUser(newSession?.user || null)
      setIsLoading(false)
    })

    return () => {
      // Unsubscribe when the component unmounts
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