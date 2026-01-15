import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'
import {
  importAwardsFromWikidata,
  getAwardImportStats,
} from '@/lib/wikidata'

/**
 * POST /api/admin/awards/import-wikidata
 *
 * Triggers import of board game awards from Wikidata.
 * Awards are linked to games by BGG ID. If a game doesn't exist in our
 * database, the award is stored as "pending" with the BGG ID for later linking.
 *
 * Query params:
 * - award: Optional award slug to import only that award (e.g., 'spiel-des-jahres')
 */
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!(await isAdmin())) {
    return ApiErrors.unauthorized()
  }

  try {
    const { searchParams } = new URL(request.url)
    const awardSlug = searchParams.get('award') || undefined

    console.log(
      awardSlug
        ? `[Admin] Starting Wikidata import for ${awardSlug}...`
        : '[Admin] Starting Wikidata awards import (all)...'
    )

    const result = await importAwardsFromWikidata(awardSlug)

    console.log('[Admin] Wikidata awards import complete:', result)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    return ApiErrors.internal(error, {
      route: 'POST /api/admin/awards/import-wikidata',
    })
  }
}

/**
 * GET /api/admin/awards/import-wikidata
 *
 * Returns current award import statistics (total, linked, pending by award).
 */
export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!(await isAdmin())) {
    return ApiErrors.unauthorized()
  }

  try {
    const stats = await getAwardImportStats()

    return NextResponse.json({
      success: true,
      ...stats,
    })
  } catch (error) {
    return ApiErrors.internal(error, {
      route: 'GET /api/admin/awards/import-wikidata',
    })
  }
}
