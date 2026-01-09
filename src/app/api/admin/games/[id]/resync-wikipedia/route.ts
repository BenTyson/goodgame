import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'
import {
  enrichGameFromWikipedia,
  prepareWikipediaStorageData,
} from '@/lib/wikipedia'
import { syncGameAwardsFromWikipedia } from '@/lib/supabase/award-queries'
import { getGameASINByBggId } from '@/lib/wikidata/client'

interface ResyncResponse {
  success: boolean
  gameId: string
  gameName: string
  wikipediaUrl: string | null
  updated: {
    gameplay: boolean
    origins: boolean
    reception: boolean
    infobox: boolean
    images: boolean
    externalLinks: boolean
    awards: boolean
    awardsSynced: number
    asin: boolean
  }
  error?: string
}

/**
 * POST /api/admin/games/[id]/resync-wikipedia
 * Re-fetch Wikipedia data for a game without reimporting the entire game
 *
 * This is useful when:
 * - Wikipedia article has been updated
 * - Bug fixes have been made to the extraction code
 * - Content needs to be refreshed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!(await isAdmin())) {
    return ApiErrors.unauthorized()
  }

  try {
    const { id: gameId } = await params
    const adminClient = createAdminClient()

    // Get game with existing Wikipedia URL and basic info
    const { data: game, error: gameError } = await adminClient
      .from('games')
      .select('id, name, wikipedia_url, year_published, bgg_id')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return ApiErrors.notFound('Game', gameError)
    }

    // Need Wikipedia URL to re-sync
    if (!game.wikipedia_url) {
      return NextResponse.json({
        success: false,
        gameId: game.id,
        gameName: game.name,
        wikipediaUrl: null,
        updated: {
          gameplay: false,
          origins: false,
          reception: false,
          infobox: false,
          images: false,
          externalLinks: false,
          awards: false,
          awardsSynced: 0,
          asin: false,
        },
        error: 'Game has no Wikipedia URL. Import or set one first.',
      } satisfies ResyncResponse, { status: 400 })
    }

    // Get designers from game_designers join for validation
    const { data: designerLinks } = await adminClient
      .from('game_designers')
      .select('designers:designer_id(name)')
      .eq('game_id', gameId)

    const designers = designerLinks
      ?.map((d) => (d.designers as unknown as { name: string })?.name)
      .filter(Boolean) as string[] | undefined

    // Re-run Wikipedia enrichment using existing URL
    console.log(`[Resync] Starting Wikipedia re-sync for: ${game.name}`)
    const enrichmentResult = await enrichGameFromWikipedia(
      game.name,
      game.year_published ?? undefined,
      designers,
      game.wikipedia_url // Use existing URL
    )

    if (!enrichmentResult.found) {
      return NextResponse.json({
        success: false,
        gameId: game.id,
        gameName: game.name,
        wikipediaUrl: game.wikipedia_url,
        updated: {
          gameplay: false,
          origins: false,
          reception: false,
          infobox: false,
          images: false,
          externalLinks: false,
          awards: false,
          awardsSynced: 0,
          asin: false,
        },
        error: enrichmentResult.error || 'Wikipedia article not found or extraction failed',
      } satisfies ResyncResponse, { status: 400 })
    }

    // Prepare storage data
    const storageData = prepareWikipediaStorageData(enrichmentResult)

    // Fetch ASIN from Wikidata if game has BGG ID and no ASIN yet
    let asinUpdated = false
    let fetchedAsin: string | null = null
    if (game.bgg_id) {
      // Check if game already has an ASIN
      const { data: currentGame } = await adminClient
        .from('games')
        .select('amazon_asin')
        .eq('id', gameId)
        .single()

      if (!currentGame?.amazon_asin) {
        console.log(`[Resync] Fetching ASIN from Wikidata for BGG ID: ${game.bgg_id}`)
        fetchedAsin = await getGameASINByBggId(String(game.bgg_id))
        if (fetchedAsin) {
          asinUpdated = true
        }
      }
    }

    // Update the database with new Wikipedia data (and ASIN if found)
    const updateData: Record<string, unknown> = {
      ...storageData,
      wikipedia_fetched_at: new Date().toISOString(),
    }

    if (fetchedAsin) {
      updateData.amazon_asin = fetchedAsin
    }

    const { error: updateError } = await adminClient
      .from('games')
      .update(updateData)
      .eq('id', gameId)

    if (updateError) {
      return ApiErrors.database(updateError, {
        route: 'POST /api/admin/games/[id]/resync-wikipedia',
      })
    }

    // Sync Wikipedia awards to game_awards table
    let awardsSynced = 0
    if (enrichmentResult.awards && enrichmentResult.awards.length > 0) {
      console.log(`[Resync] Syncing ${enrichmentResult.awards.length} awards to game_awards table`)
      const syncResult = await syncGameAwardsFromWikipedia(gameId, enrichmentResult.awards)
      awardsSynced = syncResult.synced
      if (syncResult.errors.length > 0) {
        console.warn(`[Resync] Award sync errors:`, syncResult.errors)
      }
    }

    console.log(`[Resync] Wikipedia re-sync complete for: ${game.name}`)

    // Return what was updated
    const response: ResyncResponse = {
      success: true,
      gameId: game.id,
      gameName: game.name,
      wikipediaUrl: enrichmentResult.url,
      updated: {
        gameplay: !!enrichmentResult.sections?.gameplay,
        origins: !!enrichmentResult.sections?.origins,
        reception: !!enrichmentResult.sections?.reception,
        infobox: !!enrichmentResult.infobox,
        images: (enrichmentResult.images?.length ?? 0) > 0,
        externalLinks: (enrichmentResult.externalLinks?.length ?? 0) > 0,
        awards: (enrichmentResult.awards?.length ?? 0) > 0,
        awardsSynced,
        asin: asinUpdated,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Resync] Wikipedia re-sync error:', error)
    return ApiErrors.internal(error, {
      route: 'POST /api/admin/games/[id]/resync-wikipedia',
    })
  }
}
