import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

type EntityType = 'designers' | 'publishers' | 'artists'
type JunctionTable = 'game_designers' | 'game_publishers' | 'game_artists'

const JUNCTION_TABLES: Record<EntityType, JunctionTable> = {
  designers: 'game_designers',
  publishers: 'game_publishers',
  artists: 'game_artists',
}

const FK_COLUMNS: Record<EntityType, string> = {
  designers: 'designer_id',
  publishers: 'publisher_id',
  artists: 'artist_id',
}

interface LinkUpdate {
  id: string
  is_primary?: boolean
}

/**
 * POST /api/admin/entities/link
 * Update all entity links for a game (replaces existing links)
 * Body: {
 *   gameId: string,
 *   type: 'designers'|'publishers'|'artists',
 *   entities: Array<{ id: string, is_primary?: boolean }>
 * }
 */
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { gameId, type, entities } = await request.json() as {
      gameId: string
      type: EntityType
      entities: LinkUpdate[]
    }

    if (!gameId) {
      return ApiErrors.validation('gameId is required')
    }

    if (!type || !JUNCTION_TABLES[type]) {
      return ApiErrors.validation('Invalid entity type. Must be one of: designers, publishers, artists')
    }

    if (!Array.isArray(entities)) {
      return ApiErrors.validation('entities must be an array')
    }

    const adminClient = createAdminClient()
    const junctionTable = JUNCTION_TABLES[type]
    const fkColumn = FK_COLUMNS[type]

    // Delete all existing links for this game
    const { error: deleteError } = await adminClient
      .from(junctionTable)
      .delete()
      .eq('game_id', gameId)

    if (deleteError) {
      return ApiErrors.database(deleteError, { route: `POST /api/admin/entities/link (delete ${type})` })
    }

    // Insert new links if any - handle each type separately for proper typing
    if (entities.length > 0) {
      let insertError: Error | null = null

      if (type === 'designers') {
        const links = entities.map((entity, index) => ({
          game_id: gameId,
          designer_id: entity.id,
          display_order: index,
          is_primary: entity.is_primary ?? false,
        }))
        const result = await adminClient.from('game_designers').insert(links)
        insertError = result.error
      } else if (type === 'publishers') {
        const links = entities.map((entity, index) => ({
          game_id: gameId,
          publisher_id: entity.id,
          display_order: index,
          is_primary: entity.is_primary ?? false,
        }))
        const result = await adminClient.from('game_publishers').insert(links)
        insertError = result.error
      } else if (type === 'artists') {
        const links = entities.map((entity, index) => ({
          game_id: gameId,
          artist_id: entity.id,
          display_order: index,
        }))
        const result = await adminClient.from('game_artists').insert(links)
        insertError = result.error
      }

      if (insertError) {
        return ApiErrors.database(insertError, { route: `POST /api/admin/entities/link (insert ${type})` })
      }
    }

    return NextResponse.json({ success: true, count: entities.length })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/entities/link' })
  }
}
