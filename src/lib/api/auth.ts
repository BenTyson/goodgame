/**
 * API Authentication Utilities
 */

import { NextRequest } from 'next/server'
import { timingSafeEqual } from 'crypto'

// Minimum recommended secret length for security
const MIN_SECRET_LENGTH = 32

/**
 * Timing-safe string comparison to prevent timing attacks.
 * Returns false if strings have different lengths (constant time for same-length strings).
 */
function timingSafeCompare(a: string, b: string): boolean {
  // If lengths differ, still do the comparison to avoid timing leak
  // but we know the result will be false
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)

  // If lengths differ, pad the shorter one to prevent timing leak
  // from the length comparison itself
  if (aBuffer.length !== bBuffer.length) {
    // Compare with itself to maintain constant time, then return false
    timingSafeEqual(aBuffer, aBuffer)
    return false
  }

  return timingSafeEqual(aBuffer, bBuffer)
}

/**
 * Verify cron job authentication
 * Cron jobs should include x-cron-secret header matching CRON_SECRET env var
 *
 * Security features:
 * - Timing-safe comparison to prevent timing attacks
 * - Minimum secret length validation
 * - Case-insensitive header name handling (HTTP headers are case-insensitive)
 */
export function verifyCronAuth(request: NextRequest): boolean {
  const secret = request.headers.get('x-cron-secret')
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret) {
    console.error('CRON_SECRET not configured')
    return false
  }

  if (expectedSecret.length < MIN_SECRET_LENGTH) {
    console.warn(
      `CRON_SECRET is only ${expectedSecret.length} characters. ` +
      `Recommended minimum is ${MIN_SECRET_LENGTH} characters. ` +
      'Generate with: openssl rand -hex 32'
    )
  }

  if (!secret) {
    return false
  }

  return timingSafeCompare(secret, expectedSecret)
}

/**
 * Create unauthorized response for cron endpoints
 */
export function unauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

/**
 * Create success response for API endpoints
 */
export function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

/**
 * Create error response for API endpoints
 */
export function errorResponse(message: string, status: number = 500): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
