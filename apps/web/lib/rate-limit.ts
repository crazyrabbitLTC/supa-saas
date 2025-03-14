/**
 * @file Rate Limiting Middleware
 * @version 1.0.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-06-15
 * 
 * Rate limiting middleware for Next.js API routes.
 * 
 * IMPORTANT:
 * - Any modification requires extensive testing
 * - Security features must remain intact
 * 
 * Functionality:
 * - IP-based rate limiting
 * - Configurable limits for different endpoint types
 * - Environment-specific configuration
 */

import { NextRequest, NextResponse } from 'next/server'

// Check if in development environment
const isDev = process.env.NODE_ENV === 'development'

// In-memory store for rate limiting
// Note: This will be reset on server restart
// For production, use a persistent store like Redis
const ipRequestStore: Record<string, { count: number; resetTime: number }> = {}

/**
 * Rate limit configuration for different endpoint types
 */
export enum RateLimitType {
  // Authentication endpoints - strict limits
  AUTH = 'auth',
  // API endpoints - moderate limits
  API = 'api',
  // Public endpoints - lenient limits
  PUBLIC = 'public',
}

/**
 * Rate limit configuration interface
 */
export interface RateLimitConfig {
  // Maximum number of requests in the time window
  max: number
  // Time window in milliseconds
  windowMs: number
  // Message to return when rate limit is exceeded
  message: string
}

/**
 * Get rate limit configuration based on endpoint type and environment
 * @param type - Rate limit type
 * @returns Rate limit configuration
 */
export function getRateLimitConfig(type: RateLimitType): RateLimitConfig {
  // More lenient limits in development
  if (isDev) {
    return {
      max: 100,
      windowMs: 60 * 1000, // 1 minute
      message: 'Too many requests, please try again later.',
    }
  }

  // Production limits
  switch (type) {
    case RateLimitType.AUTH:
      return {
        max: 10,
        windowMs: 60 * 1000, // 1 minute
        message: 'Too many authentication attempts, please try again later.',
      }
    case RateLimitType.API:
      return {
        max: 60,
        windowMs: 60 * 1000, // 1 minute
        message: 'Too many requests, please try again later.',
      }
    case RateLimitType.PUBLIC:
      return {
        max: 120,
        windowMs: 60 * 1000, // 1 minute
        message: 'Too many requests, please try again later.',
      }
    default:
      return {
        max: 30,
        windowMs: 60 * 1000, // 1 minute
        message: 'Too many requests, please try again later.',
      }
  }
}

/**
 * Check if a request is rate limited
 * @param ip - Client IP address
 * @param type - Rate limit type
 * @returns Boolean indicating if request is rate limited
 */
function isRateLimited(ip: string, type: RateLimitType): boolean {
  const config = getRateLimitConfig(type)
  const now = Date.now()
  
  // Get or initialize request data for this IP
  if (!ipRequestStore[ip]) {
    ipRequestStore[ip] = {
      count: 0,
      resetTime: now + config.windowMs,
    }
  }
  
  const requestData = ipRequestStore[ip]
  
  // Reset count if window has passed
  if (now > requestData.resetTime) {
    requestData.count = 0
    requestData.resetTime = now + config.windowMs
  }
  
  // Increment request count
  requestData.count++
  
  // Check if rate limit exceeded
  return requestData.count > config.max
}

/**
 * Apply rate limiting to a Next.js API route handler
 * @param handler - API route handler
 * @param type - Rate limit type
 * @returns Rate-limited handler
 */
export function applyRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse,
  type: RateLimitType = RateLimitType.API
) {
  return async function rateLimitedHandler(request: NextRequest) {
    // Skip rate limiting in development if needed
    if (isDev && process.env.DISABLE_RATE_LIMIT === 'true') {
      return handler(request)
    }
    
    // Get client IP
    const ip = request.ip || 'unknown'
    const config = getRateLimitConfig(type)
    
    try {
      // Check rate limit
      if (isRateLimited(ip, type)) {
        // Rate limit exceeded
        return NextResponse.json(
          {
            success: false,
            error: {
              message: config.message,
              code: 'RATE_LIMIT_EXCEEDED',
              status: 429,
            },
          },
          { status: 429 }
        )
      }
      
      // Rate limit not exceeded, proceed with handler
      return handler(request)
    } catch (error) {
      console.error('Rate limiting error:', error)
      // In case of error, allow the request to proceed
      return handler(request)
    }
  }
} 