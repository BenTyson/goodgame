import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'

const PUFFIN_API_URL = process.env.PUFFIN_API_URL || ''
const PUFFIN_API_KEY = process.env.PUFFIN_API_KEY || ''

interface PuffinGame {
  bggId: number
  name: string
  yearPublished: number | null
  rating: number
  rank: number | null
  thumbnail: string | null
  imported: boolean
  expansionCount: number
  isExpansion: boolean
  sources: {
    wikidata: boolean
    wikipedia: boolean
    commons: boolean
    rulebook: boolean
  }
}

interface PuffinResponse {
  games: PuffinGame[]
  total: number
  limit: number
  offset: number
}

export interface PuffinBrowseGame {
  bggId: number
  name: string
  yearPublished: number | null
  rating: number
  rank: number | null
  thumbnail: string | null
  sources: {
    wikidata: boolean
    wikipedia: boolean
    commons: boolean
    rulebook: boolean
  }
  expansionCount: number
  isExpansion: boolean
  importedToBoardmello: boolean
  boardmelloSlug?: string
  hasPuffinContent: boolean
  puffinContentFieldCount?: number
}

export interface PuffinBrowseResponse {
  games: PuffinBrowseGame[]
  total: number
  page: number
  limit: number
}

/**
 * GET /api/admin/puffin/games
 * Proxy to Puffin's games list with import status from Boardmello
 *
 * Query parameters (passed through to Puffin):
 * - search: Search by name or BGG ID
 * - enriched: true - Only games with enrichment completed
 * - hasWikidata: true - Only games with Wikidata data
 * - hasWikipedia: true - Only games with Wikipedia data
 * - hasRulebook: true - Only games with rulebook URL
 * - minRank: number - Minimum BGG rank
 * - maxRank: number - Maximum BGG rank
 * - sort: rank | rating | name
 * - page: number (1-indexed, converted to offset for Puffin)
 * - limit: number (max 50)
 */
export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  if (!PUFFIN_API_URL || !PUFFIN_API_KEY) {
    return ApiErrors.internal(new Error('Puffin service not configured'))
  }

  try {
    const { searchParams } = new URL(request.url)

    // Parse pagination params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)))
    const offset = (page - 1) * limit

    // Build Puffin API URL with all filter params
    const puffinParams = new URLSearchParams()
    puffinParams.set('limit', limit.toString())
    puffinParams.set('offset', offset.toString())

    // Pass through filter params
    const search = searchParams.get('search')
    if (search) puffinParams.set('search', search)

    const enriched = searchParams.get('enriched')
    if (enriched === 'true') puffinParams.set('enriched', 'true')

    const hasWikidata = searchParams.get('hasWikidata')
    if (hasWikidata === 'true') puffinParams.set('hasWikidata', 'true')

    const hasWikipedia = searchParams.get('hasWikipedia')
    if (hasWikipedia === 'true') puffinParams.set('hasWikipedia', 'true')

    const hasRulebook = searchParams.get('hasRulebook')
    if (hasRulebook === 'true') puffinParams.set('hasRulebook', 'true')

    const minRank = searchParams.get('minRank')
    if (minRank) puffinParams.set('minRank', minRank)

    const maxRank = searchParams.get('maxRank')
    if (maxRank) puffinParams.set('maxRank', maxRank)

    const sort = searchParams.get('sort')
    if (sort) puffinParams.set('sort', sort)

    // Fetch from Puffin
    const puffinUrl = `${PUFFIN_API_URL.replace('/api/v1', '')}/admin/api/games?${puffinParams.toString()}`
    const puffinResponse = await fetch(puffinUrl, {
      headers: {
        'Authorization': `Bearer ${PUFFIN_API_KEY}`,
        'X-Client': 'boardmello-admin',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!puffinResponse.ok) {
      console.error('Puffin API error:', puffinResponse.status, await puffinResponse.text())
      return ApiErrors.internal(new Error('Failed to fetch games from Puffin'))
    }

    const puffinData: PuffinResponse = await puffinResponse.json()

    if (puffinData.games.length === 0) {
      const response: PuffinBrowseResponse = {
        games: [],
        total: puffinData.total,
        page,
        limit,
      }
      return NextResponse.json(response)
    }

    // Get BGG IDs from Puffin results
    const bggIds = puffinData.games.map(g => g.bggId)

    // Check which games are already in Boardmello
    const supabase = createAdminClient()
    const { data: existingGames } = await supabase
      .from('games')
      .select('bgg_id, slug, puffin_content_completeness')
      .in('bgg_id', bggIds)

    const existingMap = new Map(
      (existingGames || []).map(g => [g.bgg_id!, {
        slug: g.slug,
        puffinCompleteness: g.puffin_content_completeness as { fieldCount?: number } | null,
      }])
    )

    // Merge Puffin data with Boardmello import status
    const games: PuffinBrowseGame[] = puffinData.games.map(g => {
      const existing = existingMap.get(g.bggId)
      const fieldCount = existing?.puffinCompleteness?.fieldCount
      return {
        bggId: g.bggId,
        name: g.name,
        yearPublished: g.yearPublished,
        rating: Math.round(g.rating * 10) / 10,
        rank: g.rank,
        thumbnail: g.thumbnail,
        sources: g.sources,
        expansionCount: g.expansionCount,
        isExpansion: g.isExpansion,
        importedToBoardmello: !!existing,
        boardmelloSlug: existing?.slug,
        hasPuffinContent: (fieldCount ?? 0) > 0,
        puffinContentFieldCount: fieldCount ?? undefined,
      }
    })

    const response: PuffinBrowseResponse = {
      games,
      total: puffinData.total,
      page,
      limit,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Puffin proxy error:', error)
    return ApiErrors.internal(error, { route: 'GET /api/admin/puffin/games' })
  }
}
