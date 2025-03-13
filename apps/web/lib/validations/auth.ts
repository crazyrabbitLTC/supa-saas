/**
 * @file Authentication validation schemas
 * @version 1.0.0
 * 
 * Provides Zod validation schemas for authentication forms.
 */

import { z } from 'zod'

/**
 * Password validation schema with strength requirements
 */
export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' })
  .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' })

/**
 * Signup form validation schema
 */
export const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: 'First name must be at least 2 characters' })
      .max(50, { message: 'First name must be less than 50 characters' }),
    lastName: z
      .string()
      .min(2, { message: 'Last name must be at least 2 characters' })
      .max(50, { message: 'Last name must be less than 50 characters' }),
    email: z
      .string()
      .email({ message: 'Please enter a valid email address' })
      .min(5, { message: 'Email must be at least 5 characters' })
      .max(100, { message: 'Email must be less than 100 characters' }),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .min(5, { message: 'Email must be at least 5 characters' }),
  password: z.string().min(1, { message: 'Password is required' }),
})

/**
 * Type for the signup form data
 */
export type SignupFormData = z.infer<typeof signupSchema>

/**
 * Type for the login form data
 */
export type LoginFormData = z.infer<typeof loginSchema> 