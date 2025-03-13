'use client'

/**
 * @file Supabase client for browser components
 * @version 1.0.0
 * 
 * This file provides utilities for initializing and using Supabase
 * in client components.
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

/**
 * Creates a Supabase client for use in browser contexts
 * @returns Supabase client instance
 */
export const createBrowserSupabaseClient = () => {
  return createClient(supabaseUrl!, supabaseAnonKey!)
}

/**
 * Gets a Supabase client for use in client components
 * This is a singleton instance that can be used throughout the client-side app
 */
export const browserSupabase = createBrowserSupabaseClient() 