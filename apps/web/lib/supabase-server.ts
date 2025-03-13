/**
 * @file Supabase client for server components
 * @version 1.0.0
 * 
 * This file provides utilities for initializing and using Supabase
 * in server components.
 */

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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
 * Creates a Supabase client for use in server contexts
 * @returns Supabase client instance with cookie-based auth
 */
export const createServerSupabaseClient = () => {
  const cookieStore = cookies()
  
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
} 