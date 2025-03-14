/**
 * @file CSRF Token API Route
 * @version 1.2.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-06-15
 * 
 * API route for CSRF token generation and validation.
 * 
 * IMPORTANT:
 * - Any modification requires extensive testing
 * - Security features must remain intact
 * 
 * Functionality:
 * - GET: Generate and return a new CSRF token
 * - POST: Validate a provided CSRF token
 */

import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { cookies } from 'next/headers'
import { CookieType, setApiCookie } from '../../../lib/cookie-manager'
import { applyRateLimit, RateLimitType } from '../../../lib/rate-limit'

// Constants
export const CSRF_TOKEN_COOKIE = 'csrfToken'
export const CSRF_TOKEN_HEADER = 'X-CSRF-Token'
export const CSRF_TOKEN_EXPIRY = 60 * 60 * 24 // 24 hours in seconds

/**
 * Interface for CSRF token with metadata
 */
export interface CSRFToken {
  token: string
  expires: number // Unix timestamp in seconds
}

/**
 * Generates a new CSRF token with expiration
 * @returns CSRF token object with token value and expiration
 */
export const generateCSRFToken = (): CSRFToken => {
  const token = uuidv4()
  const expires = Math.floor(Date.now() / 1000) + CSRF_TOKEN_EXPIRY
  
  return {
    token,
    expires,
  }
}

/**
 * Validates a CSRF token against the stored token
 * @param token - The token to validate
 * @returns Boolean indicating if the token is valid
 */
export const validateCSRFToken = (token: string): boolean => {
  const cookieStore = cookies()
  const storedTokenJson = cookieStore.get(CSRF_TOKEN_COOKIE)?.value ||
                          cookieStore.get(`__Host-${CSRF_TOKEN_COOKIE}`)?.value ||
                          cookieStore.get(`__Secure-${CSRF_TOKEN_COOKIE}`)?.value
  
  if (!storedTokenJson) {
    console.warn('CSRF validation failed: No stored token found')
    return false
  }
  
  try {
    const storedToken: CSRFToken = JSON.parse(storedTokenJson)
    
    // Check if token matches and hasn't expired
    const now = Math.floor(Date.now() / 1000)
    const isValid = storedToken.token === token && storedToken.expires > now
    
    if (!isValid) {
      console.warn('CSRF validation failed: Token expired or mismatch', {
        tokenMatch: storedToken.token === token,
        expired: storedToken.expires <= now,
        expiresIn: storedToken.expires - now
      })
    }
    
    return isValid
  } catch (error) {
    console.error('Error validating CSRF token:', error)
    return false
  }
}

/**
 * GET handler - Generate and return a new CSRF token
 */
async function getHandler(request: NextRequest) {
  try {
    // Generate a new CSRF token
    const csrfToken = generateCSRFToken()
    
    // Create the response
    const response = NextResponse.json({
      success: true,
      token: csrfToken.token
    })
    
    // Set the token in a secure, httpOnly cookie using our cookie manager
    setApiCookie(
      response,
      CSRF_TOKEN_COOKIE,
      JSON.stringify(csrfToken),
      CookieType.AUTH,
      {
        expires: new Date(csrfToken.expires * 1000) // Convert to milliseconds
      }
    )
    
    return response
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}

/**
 * POST handler - Validate a provided CSRF token
 */
async function postHandler(request: NextRequest) {
  try {
    // Get the token from the request body
    const body = await request.json()
    const { token } = body
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 400 }
      )
    }
    
    // Validate the token
    const isValid = validateCSRFToken(token)
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error validating CSRF token:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to validate CSRF token' },
      { status: 500 }
    )
  }
}

// Apply rate limiting to handlers
export const GET = applyRateLimit(getHandler, RateLimitType.API)
export const POST = applyRateLimit(postHandler, RateLimitType.API) 