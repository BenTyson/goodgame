/**
 * Simple In-Memory Rate Limiter
 *
 * Uses a sliding window algorithm to rate limit requests.
 * For production with multiple servers, consider using Redis instead.
 */

import { NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store for rate limit data
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries periodically
const CLEANUP_INTERVAL_MS = 60 * 1000 // 1 minute
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return

  lastCleanup = now
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
  /** Key prefix for namespacing different endpoints */
  prefix?: string
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for a given identifier (e.g., IP, user ID)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup()

  const { limit, windowSeconds, prefix = 'default' } = config
  const key = `${prefix}:${identifier}`
  const now = Date.now()
  const windowMs = windowSeconds * 1000

  const entry = rateLimitStore.get(key)

  // No existing entry or window expired - allow and start new window
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })
    return {
      success: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    }
  }

  // Window still active - check limit
  if (entry.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  // Increment count
  entry.count++
  return {
    success: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
  // Check various headers for IP (in order of preference)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback for local development
  return 'localhost'
}

/**
 * Apply rate limiting to an admin API endpoint
 *
 * @param request - The incoming request
 * @param config - Rate limit configuration
 * @returns null if allowed, NextResponse if rate limited
 */
export function applyRateLimit(
  request: Request,
  config: RateLimitConfig = { limit: 60, windowSeconds: 60, prefix: 'admin' }
): NextResponse | null {
  const identifier = getClientIdentifier(request)
  const result = checkRateLimit(identifier, config)

  if (!result.success) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      {
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(result.resetAt),
        },
      }
    )
  }

  return null
}

/**
 * Rate limit presets for different endpoint types
 */
export const RateLimits = {
  /** Standard admin operations: 60 requests per minute */
  ADMIN_STANDARD: { limit: 60, windowSeconds: 60, prefix: 'admin' },

  /** File uploads: 20 per minute (more restrictive) */
  FILE_UPLOAD: { limit: 20, windowSeconds: 60, prefix: 'upload' },

  /** Cron jobs: 1 per minute (prevent duplicate runs) */
  CRON: { limit: 1, windowSeconds: 60, prefix: 'cron' },

  /** Auth endpoints: 10 per minute (prevent brute force) */
  AUTH: { limit: 10, windowSeconds: 60, prefix: 'auth' },
} as const
