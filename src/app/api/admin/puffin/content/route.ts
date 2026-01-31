/**
 * Admin Puffin Content API
 *
 * GET /api/admin/puffin/content
 *   Returns content sync status (cursor, coverage stats).
 *
 * POST /api/admin/puffin/content
 *   Import content from Puffin. Three modes:
 *   - ?bggIds=224517,124361  Import specific games (max 50)
 *   - ?all=true              Backfill games missing puffin_content (batches of 50, limit 200)
 *   - No params              One page of feed sync
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin, createAdminClient } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'
import {
  getContentSyncStatus,
  syncContentFromFeed,
  importContentForGames,
} from '@/lib/bgg/content-importer'

export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const status = await getContentSyncStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error('Puffin content status error:', error)
    return ApiErrors.internal(error, { route: 'GET /api/admin/puffin/content' })
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { searchParams } = new URL(request.url)
    const bggIdsParam = searchParams.get('bggIds')
    const allParam = searchParams.get('all')

    // Mode 1: Import specific games by BGG IDs
    if (bggIdsParam) {
      const bggIds = bggIdsParam
        .split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !isNaN(id))
        .slice(0, 50) // Max 50 at a time

      if (bggIds.length === 0) {
        return ApiErrors.validation('No valid BGG IDs provided')
      }

      const results = await importContentForGames(bggIds)

      return NextResponse.json({
        mode: 'specific',
        requested: bggIds.length,
        updated: results.filter(r => r.updated).length,
        skipped: results.filter(r => r.skipped).length,
        errors: results.filter(r => r.error && !r.skipped).map(r => `BGG ${r.bggId}: ${r.error}`),
        results,
      })
    }

    // Mode 2: Backfill games missing puffin_content
    if (allParam === 'true') {
      const supabase = createAdminClient()

      // Find games with bgg_id but no puffin_content
      const { data: games } = await supabase
        .from('games')
        .select('bgg_id')
        .not('bgg_id', 'is', null)
        .is('puffin_content', null)
        .order('created_at', { ascending: false })
        .limit(200)

      if (!games || games.length === 0) {
        return NextResponse.json({
          mode: 'backfill',
          message: 'All games already have Puffin content',
          processed: 0,
        })
      }

      const allBggIds = games.map(g => g.bgg_id!).filter(Boolean)
      const allResults = []

      // Process in batches of 50
      for (let i = 0; i < allBggIds.length; i += 50) {
        const batch = allBggIds.slice(i, i + 50)
        const batchResults = await importContentForGames(batch)
        allResults.push(...batchResults)
      }

      return NextResponse.json({
        mode: 'backfill',
        totalGames: allBggIds.length,
        updated: allResults.filter(r => r.updated).length,
        skipped: allResults.filter(r => r.skipped).length,
        errors: allResults.filter(r => r.error && !r.skipped).map(r => `BGG ${r.bggId}: ${r.error}`),
      })
    }

    // Mode 3: One page of feed sync (default)
    const result = await syncContentFromFeed()

    return NextResponse.json({
      mode: 'feed',
      ...result,
    })
  } catch (error) {
    console.error('Puffin content import error:', error)
    return ApiErrors.internal(error, { route: 'POST /api/admin/puffin/content' })
  }
}
