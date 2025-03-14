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
import { RateLimiter } from 'next-rate-limit'

// Check if in development environment
const isDev = process.env.NODE_ENV === 'development'

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
  // Time window in seconds
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
 * Create a rate limiter instance for a specific endpoint type
 * @param type - Rate limit type
 * @returns Rate limiter instance
 */
export function createRateLimiter(type: RateLimitType): RateLimiter {
  const config = getRateLimitConfig(type)
  
  return new RateLimiter({
    interval: config.windowMs,
    limit: config.max,
  })
}

/**
 * Rate limiting middleware for Next.js API routes
 * @param type - Rate limit type
 * @returns Middleware function
 */
export function withRateLimit(type: RateLimitType = RateLimitType.API) {
  const limiter = createRateLimiter(type)
  const config = getRateLimitConfig(type)
  
  return async function rateLimit(request: NextRequest) {
    // Skip rate limiting in development if needed
    if (isDev && process.env.DISABLE_RATE_LIMIT === 'true') {
      return null
    }
    
    // Get client IP
    const ip = request.ip || 'unknown'
    
    try {
      // Check rate limit
      const { success } = await limiter.check(ip)
      
      if (!success) {
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
      
      // Rate limit not exceeded
      return null
    } catch (error) {
      console.error('Rate limiting error:', error)
      // In case of error, allow the request to proceed
      return null
    }
  }
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
  const rateLimitMiddleware = withRateLimit(type)
  
  return async function rateLimitedHandler(request: NextRequest) {
    // Apply rate limiting
    const rateLimitResult = await rateLimitMiddleware(request)
    
    // If rate limit is exceeded, return the error response
    if (rateLimitResult) {
      return rateLimitResult
    }
    
    // Otherwise, proceed with the handler
    return handler(request)
  }
} 