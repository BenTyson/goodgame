import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'
import type { RelationType } from '@/types/database'

interface BGGLink {
  id?: number
  bgg_id?: number
  name: string
  direction?: string
  inbound?: boolean
}

interface BGGRawData {
  expandsGame?: BGGLink
  expansions?: BGGLink[]
  implementsGame?: BGGLink
  implementations?: BGGLink[]
}

/**
 * Sync relations for a single game from its bgg_raw_data
 * POST /api/admin/sync-relations
 * { gameId: string, type: 'all' | 'implementations' | 'expansions' }
 */
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { gameId, type = 'all' } = await request.json()

    if (!gameId) {
      return ApiErrors.validation('Missing gameId')
    }

    const adminClient = createAdminClient()

    // Get game with bgg_raw_data
    const { data: game, error: gameError } = await adminClient
      .from('games')
      .select('id, bgg_id, name, bgg_raw_data')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return ApiErrors.notFound('Game not found')
    }

    const rawData = game.bgg_raw_data as BGGRawData | null
    if (!rawData) {
      return NextResponse.json({
        success: true,
        message: 'No bgg_raw_data to process',
        created: 0
      })
    }

    let created = 0

    // Process expansions
    if (type === 'expansions' || type === 'all') {
      // This game expands another
      if (rawData.expandsGame) {
        const bggId = rawData.expandsGame.bgg_id || rawData.expandsGame.id
        if (bggId) {
          const result = await createRelationIfNotExists(
            adminClient,
            gameId,
            bggId,
            'expansion_of'
          )
          if (result) created++
        }
      }

      // Check expansions array for direction
      if (rawData.expansions) {
        for (const exp of rawData.expansions) {
          const bggId = exp.bgg_id || exp.id
          if (!bggId) continue
          const isExpansionOf = exp.direction === 'expands' || exp.inbound === false
          if (isExpansionOf) {
            const result = await createRelationIfNotExists(
              adminClient,
              gameId,
              bggId,
              'expansion_of'
            )
            if (result) created++
          }
        }
      }
    }

    // Process implementations
    if (type === 'implementations' || type === 'all') {
      // This game reimplements another
      if (rawData.implementsGame) {
        const bggId = rawData.implementsGame.bgg_id || rawData.implementsGame.id
        if (bggId) {
          const result = await createRelationIfNotExists(
            adminClient,
            gameId,
            bggId,
            'reimplementation_of'
          )
          if (result) created++
        }
      }

      // Check implementations array for direction
      if (rawData.implementations) {
        for (const impl of rawData.implementations) {
          const bggId = impl.bgg_id || impl.id
          if (!bggId) continue
          const isReimplementationOf = impl.direction === 'reimplements' || impl.inbound === false
          if (isReimplementationOf) {
            const result = await createRelationIfNotExists(
              adminClient,
              gameId,
              bggId,
              'reimplementation_of'
            )
            if (result) created++
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: created > 0 ? `Created ${created} relation(s)` : 'No new relations to create',
      created
    })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/sync-relations' })
  }
}

async function createRelationIfNotExists(
  supabase: ReturnType<typeof createAdminClient>,
  sourceGameId: string,
  targetBggId: number,
  relationType: RelationType
): Promise<boolean> {
  // Find target game by BGG ID
  const { data: targetGame } = await supabase
    .from('games')
    .select('id')
    .eq('bgg_id', targetBggId)
    .single()

  if (!targetGame) return false

  // Check if exists
  const { data: existing } = await supabase
    .from('game_relations')
    .select('id')
    .eq('source_game_id', sourceGameId)
    .eq('target_game_id', targetGame.id)
    .eq('relation_type', relationType)
    .single()

  if (existing) return false

  // Create relation
  const { error } = await supabase
    .from('game_relations')
    .insert({
      source_game_id: sourceGameId,
      target_game_id: targetGame.id,
      relation_type: relationType,
    })

  return !error
}
