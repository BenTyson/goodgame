/**
 * BGG Import Cron Endpoint
 *
 * POST /api/cron/import-bgg
 *
 * Triggered by cron-job.org to import games from BGG.
 * Processes up to 5 games from the import queue per run.
 *
 * Headers:
 *   x-cron-secret: Required, must match CRON_SECRET env var
 *
 * Query params:
 *   limit: Number of games to import (default: 5, max: 10)
 *   seed: Optional - 'awards' or 'top100' to seed queue before import
 */

import { NextRequest } from 'next/server'
import { verifyCronAuth, unauthorizedResponse, jsonResponse, errorResponse } from '@/lib/api/auth'
import { importNextBatch, getQueueStats } from '@/lib/bgg'
import { seedFromAwards, seedFromBGGTop } from '@/lib/bgg/seed-queue'

export const maxDuration = 60 // Allow up to 60 seconds for rate-limited BGG fetches

export async function POST(request: NextRequest) {
  // Verify authentication
  if (!verifyCronAuth(request)) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 10)
    const seed = searchParams.get('seed')

    // Optionally seed the queue first
    let seedResult = null
    if (seed === 'awards') {
      seedResult = await seedFromAwards()
    } else if (seed === 'top100') {
      seedResult = await seedFromBGGTop(100)
    }

    // Import games from queue
    const importResults = await importNextBatch(limit)

    // Get updated queue stats
    const queueStats = await getQueueStats()

    return jsonResponse({
      success: true,
      imported: importResults.length,
      results: importResults.map(r => ({
        bggId: r.bggId,
        name: r.name,
        success: r.success,
        error: r.error,
      })),
      seedResult,
      queue: queueStats,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Import failed'
    )
  }
}

// Also support GET for manual testing (still requires auth)
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return unauthorizedResponse()
  }

  try {
    const queueStats = await getQueueStats()

    return jsonResponse({
      status: 'ready',
      queue: queueStats,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Status check failed'
    )
  }
}
