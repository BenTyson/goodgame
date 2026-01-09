import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'
import { searchYouTube } from '@/lib/youtube'

/**
 * GET /api/admin/youtube/search?q=game+name
 *
 * Search YouTube for board game videos.
 *
 * Query parameters:
 * - q: Search query (e.g., "Catan Board Game Overview")
 * - limit: Max results (default 6, max 12)
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 12)

    if (!query) {
      return ApiErrors.validation('Search query (q) is required')
    }

    // Check if API key is configured
    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json(
        {
          error: 'YouTube API key not configured',
          setupRequired: true,
        },
        { status: 503 }
      )
    }

    const result = await searchYouTube(query, limit)

    return NextResponse.json({
      videos: result.videos,
      youtubeSearchUrl: result.youtubeSearchUrl,
    })
  } catch (error) {
    console.error('[YouTube Search] Error:', error)

    // Handle quota exceeded specifically
    if (error instanceof Error && error.message.includes('quota')) {
      return NextResponse.json(
        {
          error: error.message,
          quotaExceeded: true,
          youtubeSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
            new URL(request.url).searchParams.get('q') || ''
          )}`,
        },
        { status: 429 }
      )
    }

    return ApiErrors.internal(error, { route: 'GET /api/admin/youtube/search' })
  }
}
