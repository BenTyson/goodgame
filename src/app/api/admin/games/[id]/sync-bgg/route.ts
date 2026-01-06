import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'
import { syncGameWithBGG } from '@/lib/bgg/importer'

/**
 * POST /api/admin/games/[id]/sync-bgg
 * Re-sync a game's data from BoardGameGeek
 * This re-fetches BGG data and re-runs category/mechanic/theme mappings
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { id: gameId } = await params

    const result = await syncGameWithBGG(gameId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Sync failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      gameId: result.gameId,
      slug: result.slug,
      name: result.name,
    })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/games/[id]/sync-bgg' })
  }
}
