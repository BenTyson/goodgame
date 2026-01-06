import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'
import { fetchBGGGames, type BGGRawGame } from '@/lib/bgg/client'

interface AnalyzeRequest {
  bggIds: number[]
  relationMode: 'all' | 'upstream' | 'none'
  maxDepth: number
}

interface GameAnalysis {
  bggId: number
  name: string
  year: number | null
  rank: number | null
  rating: number
  status: 'new' | 'exists' | 'error'
  existingGameId?: string
  existingSlug?: string
  error?: string
  // Relation counts for this game
  expansionCount: number
  baseGameCount: number
  reimplementationCount: number
}

interface RelationGame {
  bggId: number
  name: string
  year?: number | null
}

interface AnalyzeResponse {
  games: GameAnalysis[]
  relations: {
    expansions: number
    baseGames: number
    reimplementations: number
  }
  relationsDetail: {
    expansions: RelationGame[]
    baseGames: RelationGame[]
    reimplementations: RelationGame[]
  }
  totals: {
    new: number
    existing: number
    failed: number
    estimatedSeconds: number
  }
}

/**
 * POST /api/admin/import/analyze
 * Analyze BGG IDs to preview what would be imported
 */
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const body: AnalyzeRequest = await request.json()
    const { bggIds, relationMode = 'upstream', maxDepth = 3 } = body

    if (!bggIds || !Array.isArray(bggIds) || bggIds.length === 0) {
      return ApiErrors.validation('At least one BGG ID is required')
    }

    if (bggIds.length > 100) {
      return ApiErrors.validation('Maximum 100 games per import')
    }

    // Filter to valid numbers
    const validIds = bggIds.filter(id => typeof id === 'number' && id > 0)
    if (validIds.length === 0) {
      return ApiErrors.validation('No valid BGG IDs provided')
    }

    const adminClient = createAdminClient()

    // Check which games already exist in our DB
    const { data: existingGames } = await adminClient
      .from('games')
      .select('id, slug, bgg_id')
      .in('bgg_id', validIds)

    const existingMap = new Map(
      (existingGames || []).map(g => [g.bgg_id!, { id: g.id, slug: g.slug }])
    )

    // Fetch game data from BGG (batched, respects rate limits)
    const bggGamesMap = await fetchBGGGames(validIds)

    // Analyze each game
    const games: GameAnalysis[] = []
    let totalExpansions = 0
    let totalBaseGames = 0
    let totalReimplementations = 0

    // Track unique relation games to avoid duplicates
    const expansionGamesMap = new Map<number, RelationGame>()
    const baseGamesMap = new Map<number, RelationGame>()
    const reimplementationGamesMap = new Map<number, RelationGame>()

    for (const bggId of validIds) {
      const bggData = bggGamesMap.get(bggId)
      const existing = existingMap.get(bggId)

      if (!bggData) {
        games.push({
          bggId,
          name: `Unknown (BGG ID: ${bggId})`,
          year: null,
          rank: null,
          rating: 0,
          status: 'error',
          error: 'Game not found on BGG',
          expansionCount: 0,
          baseGameCount: 0,
          reimplementationCount: 0,
        })
        continue
      }

      // Calculate relation counts based on mode
      let expansionCount = 0
      let baseGameCount = 0
      let reimplementationCount = 0

      if (relationMode !== 'none') {
        if (relationMode === 'all') {
          // All relations: expansions (downstream) + base game (upstream) + reimplementations
          // Note: We can't filter fan expansions here without fetching each expansion's data
          // The execute endpoint will filter them, so this is an upper bound estimate
          expansionCount = bggData.expansions?.length || 0

          // Collect expansion details
          for (const exp of bggData.expansions || []) {
            if (!expansionGamesMap.has(exp.id)) {
              expansionGamesMap.set(exp.id, { bggId: exp.id, name: exp.name })
            }
          }
        }
        // Both 'all' and 'upstream' include parent/base games
        if (bggData.expandsGame) {
          baseGameCount = 1
          if (!baseGamesMap.has(bggData.expandsGame.id)) {
            baseGamesMap.set(bggData.expandsGame.id, {
              bggId: bggData.expandsGame.id,
              name: bggData.expandsGame.name,
            })
          }
        }
        if (bggData.implementsGame) {
          reimplementationCount = 1
          if (!reimplementationGamesMap.has(bggData.implementsGame.id)) {
            reimplementationGamesMap.set(bggData.implementsGame.id, {
              bggId: bggData.implementsGame.id,
              name: bggData.implementsGame.name,
            })
          }
        }
      }

      totalExpansions += expansionCount
      totalBaseGames += baseGameCount
      totalReimplementations += reimplementationCount

      games.push({
        bggId,
        name: bggData.name,
        year: bggData.yearPublished,
        rank: bggData.rank,
        rating: Math.round(bggData.rating * 10) / 10,
        status: existing ? 'exists' : 'new',
        existingGameId: existing?.id,
        existingSlug: existing?.slug,
        expansionCount,
        baseGameCount,
        reimplementationCount,
      })
    }

    // Convert maps to arrays for response
    const expansionGames = Array.from(expansionGamesMap.values())
    const baseGames = Array.from(baseGamesMap.values())
    const reimplementationGames = Array.from(reimplementationGamesMap.values())

    // Calculate totals
    const newCount = games.filter(g => g.status === 'new').length
    const existingCount = games.filter(g => g.status === 'exists').length
    const failedCount = games.filter(g => g.status === 'error').length

    // Estimate time: ~1.5s per game (BGG rate limit + Wikidata enrichment)
    const totalGamesToProcess = newCount + existingCount + totalExpansions + totalBaseGames + totalReimplementations
    const estimatedSeconds = Math.ceil(totalGamesToProcess * 1.5)

    const response: AnalyzeResponse = {
      games,
      relations: {
        expansions: expansionGames.length,
        baseGames: baseGames.length,
        reimplementations: reimplementationGames.length,
      },
      relationsDetail: {
        expansions: expansionGames,
        baseGames: baseGames,
        reimplementations: reimplementationGames,
      },
      totals: {
        new: newCount,
        existing: existingCount,
        failed: failedCount,
        estimatedSeconds,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/import/analyze' })
  }
}
