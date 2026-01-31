/**
 * Puffin Content Sync Cron Endpoint
 *
 * POST /api/cron/sync-puffin-content
 *   Syncs AI-generated content from Puffin's content feed.
 *   Uses cursor-based pagination to process incremental updates.
 *
 * GET /api/cron/sync-puffin-content
 *   Returns current sync status (cursor position, coverage stats).
 *
 * Headers:
 *   x-cron-secret: Required, must match CRON_SECRET env var
 *
 * Query params:
 *   limit: Number of items to process per run (default: 50, max: 100)
 */

import { NextRequest } from 'next/server'
import { verifyCronAuth, unauthorizedResponse, jsonResponse, errorResponse } from '@/lib/api/auth'
import { syncContentFromFeed, getContentSyncStatus } from '@/lib/bgg/content-importer'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

export const maxDuration = 120

export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.CRON)
  if (rateLimited) return rateLimited

  if (!verifyCronAuth(request)) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const result = await syncContentFromFeed(limit)

    return jsonResponse({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Content sync failed'
    )
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return unauthorizedResponse()
  }

  try {
    const status = await getContentSyncStatus()

    return jsonResponse({
      status: 'ready',
      ...status,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Status check failed'
    )
  }
}
