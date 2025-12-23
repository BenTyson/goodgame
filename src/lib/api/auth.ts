/**
 * API Authentication Utilities
 */

import { NextRequest } from 'next/server'

/**
 * Verify cron job authentication
 * Cron jobs should include x-cron-secret header matching CRON_SECRET env var
 */
export function verifyCronAuth(request: NextRequest): boolean {
  const secret = request.headers.get('x-cron-secret')
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret) {
    console.error('CRON_SECRET not configured')
    return false
  }

  return secret === expectedSecret
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
