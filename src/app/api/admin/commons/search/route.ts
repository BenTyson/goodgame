import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'
import {
  searchCommonsImages,
  searchCommonsByCategory,
  getCommonsSearchUrl,
} from '@/lib/wikimedia-commons'

/**
 * GET /api/admin/commons/search?q=game+name
 *
 * Search Wikimedia Commons for board game images.
 *
 * Query parameters:
 * - q: Search query (game name)
 * - limit: Max results (default 10, max 20)
 * - category: Search by category instead of text search
 * - requireCC: Only return CC-licensed images (default false)
 */
export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!(await isAdmin())) {
    return ApiErrors.unauthorized()
  }

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const category = searchParams.get('category')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)
    const requireCC = searchParams.get('requireCC') === 'true'

    if (!query && !category) {
      return ApiErrors.validation('Search query (q) or category is required')
    }

    let result

    if (category) {
      // Search by category
      result = await searchCommonsByCategory(category, {
        limit,
        thumbWidth: 400,
      })
    } else {
      // Search by game name
      result = await searchCommonsImages(query!, {
        limit,
        thumbWidth: 400,
        requireCC,
      })
    }

    return NextResponse.json({
      images: result.images,
      totalHits: result.totalHits,
      hasMore: result.hasMore,
      query: result.query,
      // Include a link to Commons search for manual exploration
      commonsSearchUrl: getCommonsSearchUrl(query || category || ''),
    })
  } catch (error) {
    console.error('[Commons Search] Error:', error)
    return ApiErrors.internal(error, { route: 'GET /api/admin/commons/search' })
  }
}
