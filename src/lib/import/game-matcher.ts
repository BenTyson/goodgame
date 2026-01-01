import { createClient } from '@/lib/supabase/server'
import type { BGGCollectionRow } from './bgg-csv-parser'

export interface MatchedGame {
  bggId: number
  gameId: string
  gameName: string
  slug: string
}

export interface UnmatchedGame {
  bggId: number
  name: string
}

export interface MatchResult {
  matched: MatchedGame[]
  unmatched: UnmatchedGame[]
}

/**
 * Match BGG IDs from a parsed collection to games in our database
 *
 * @param rows - Parsed BGG collection rows
 * @returns Object containing matched games (with our game IDs) and unmatched games
 */
export async function matchGamesByBGGId(
  rows: BGGCollectionRow[]
): Promise<MatchResult> {
  if (rows.length === 0) {
    return { matched: [], unmatched: [] }
  }

  const supabase = await createClient()

  // Extract unique BGG IDs
  const bggIds = [...new Set(rows.map((r) => r.objectid))]

  // Batch query games table by bgg_id
  // Supabase .in() has a limit, so we batch in chunks of 100
  const BATCH_SIZE = 100
  const matchedGamesMap = new Map<number, { id: string; name: string; slug: string }>()

  for (let i = 0; i < bggIds.length; i += BATCH_SIZE) {
    const batch = bggIds.slice(i, i + BATCH_SIZE)

    const { data: games, error } = await supabase
      .from('games')
      .select('id, name, slug, bgg_id')
      .in('bgg_id', batch)

    if (error) {
      console.error('Error querying games:', error)
      continue
    }

    if (games) {
      for (const game of games) {
        if (game.bgg_id) {
          matchedGamesMap.set(game.bgg_id, {
            id: game.id,
            name: game.name,
            slug: game.slug,
          })
        }
      }
    }
  }

  // Build results by preserving order from input rows
  const matched: MatchedGame[] = []
  const unmatched: UnmatchedGame[] = []
  const seenBggIds = new Set<number>()

  for (const row of rows) {
    // Skip duplicates (same BGG ID appearing multiple times)
    if (seenBggIds.has(row.objectid)) {
      continue
    }
    seenBggIds.add(row.objectid)

    const gameInfo = matchedGamesMap.get(row.objectid)
    if (gameInfo) {
      matched.push({
        bggId: row.objectid,
        gameId: gameInfo.id,
        gameName: gameInfo.name,
        slug: gameInfo.slug,
      })
    } else {
      unmatched.push({
        bggId: row.objectid,
        name: row.objectname,
      })
    }
  }

  return { matched, unmatched }
}

/**
 * Create a lookup map from BGG ID to our game ID for efficient import processing
 */
export function createBGGToGameIdMap(matched: MatchedGame[]): Map<number, string> {
  const map = new Map<number, string>()
  for (const m of matched) {
    map.set(m.bggId, m.gameId)
  }
  return map
}
