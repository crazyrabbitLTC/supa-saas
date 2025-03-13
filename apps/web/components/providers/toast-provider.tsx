'use client'

/**
 * @file Toast provider component
 * @version 1.0.0
 * 
 * Provides toast notifications for the application.
 */

import { Toaster } from 'sonner'

/**
 * Toast provider component wrapping Sonner's Toaster
 * Provides consistent styling for all toasts in the application
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          border: '1px solid hsl(var(--border))',
        },
      }}
    />
  )
} 