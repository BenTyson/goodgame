import { createClient } from '@/lib/supabase/server'
import type { BGGCollectionRow } from './bgg-csv-parser'
import type { MatchResult } from './game-matcher'
import { createBGGToGameIdMap } from './game-matcher'
import type { ShelfStatus, UserGameInsert } from '@/types/database'

export interface ImportOptions {
  /** If true, overwrite existing shelf entries. If false, skip games already on shelf. */
  overwriteExisting: boolean
  /** If true, import ratings from BGG. If false, preserve existing ratings. */
  importRatings: boolean
  /** If true, import comments as notes. If false, skip comments. */
  importNotes: boolean
}

export interface ImportResult {
  /** Number of new games added to shelf */
  imported: number
  /** Number of existing games updated */
  updated: number
  /** Number of games skipped (already on shelf, overwrite disabled) */
  skipped: number
  /** Games not in our database */
  unmatched: { bggId: number; name: string }[]
  /** Any errors that occurred during import */
  errors: string[]
}

const DEFAULT_OPTIONS: ImportOptions = {
  overwriteExisting: false,
  importRatings: true,
  importNotes: true,
}

/**
 * Import a parsed BGG collection into a user's shelf
 *
 * @param userId - The user ID to import games for
 * @param rows - Parsed BGG collection rows
 * @param matchResult - Result from matchGamesByBGGId
 * @param options - Import options
 * @returns Import statistics and unmatched games
 */
export async function importCollection(
  userId: string,
  rows: BGGCollectionRow[],
  matchResult: MatchResult,
  options: Partial<ImportOptions> = {}
): Promise<ImportResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const supabase = await createClient()

  const result: ImportResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    unmatched: matchResult.unmatched,
    errors: [],
  }

  if (matchResult.matched.length === 0) {
    return result
  }

  // Create lookup map from BGG ID to our game ID
  const bggToGameId = createBGGToGameIdMap(matchResult.matched)

  // Get user's existing shelf entries for matched games
  const gameIds = matchResult.matched.map((m) => m.gameId)
  const { data: existingGames, error: fetchError } = await supabase
    .from('user_games')
    .select('game_id, status, rating, notes')
    .eq('user_id', userId)
    .in('game_id', gameIds)

  if (fetchError) {
    result.errors.push(`Failed to fetch existing shelf: ${fetchError.message}`)
    return result
  }

  // Build map of existing entries
  const existingMap = new Map<
    string,
    { status: ShelfStatus; rating: number | null; notes: string | null }
  >()
  for (const game of existingGames || []) {
    existingMap.set(game.game_id, {
      status: game.status as ShelfStatus,
      rating: game.rating,
      notes: game.notes,
    })
  }

  // Process rows in batches
  const BATCH_SIZE = 50
  const toUpsert: UserGameInsert[] = []

  for (const row of rows) {
    const gameId = bggToGameId.get(row.objectid)
    if (!gameId) {
      // Not matched - already tracked in unmatched
      continue
    }

    const existing = existingMap.get(gameId)

    if (existing && !opts.overwriteExisting) {
      // Skip - game already on shelf and not overwriting
      result.skipped++
      continue
    }

    // Build the insert/update record
    const record: UserGameInsert = {
      user_id: userId,
      game_id: gameId,
      status: row.status,
    }

    // Handle rating
    if (opts.importRatings && row.rating !== null) {
      record.rating = row.rating
    } else if (existing && !opts.importRatings) {
      // Preserve existing rating
      record.rating = existing.rating
    }

    // Handle notes/comments
    if (opts.importNotes && row.comment) {
      record.notes = row.comment
    } else if (existing && !opts.importNotes) {
      // Preserve existing notes
      record.notes = existing.notes
    }

    toUpsert.push(record)

    if (existing) {
      result.updated++
    } else {
      result.imported++
    }
  }

  // Batch upsert
  for (let i = 0; i < toUpsert.length; i += BATCH_SIZE) {
    const batch = toUpsert.slice(i, i + BATCH_SIZE)

    const { error: upsertError } = await supabase
      .from('user_games')
      .upsert(batch, { onConflict: 'user_id,game_id' })

    if (upsertError) {
      result.errors.push(
        `Failed to import batch ${Math.floor(i / BATCH_SIZE) + 1}: ${upsertError.message}`
      )
      // Adjust counts for failed batch
      const failedCount = batch.length
      // We don't know exactly which were imports vs updates, so just subtract from total
      if (result.imported >= failedCount) {
        result.imported -= failedCount
      } else {
        const remaining = failedCount - result.imported
        result.imported = 0
        result.updated = Math.max(0, result.updated - remaining)
      }
    }
  }

  return result
}

/**
 * Preview what an import would do without actually importing
 * Useful for showing the user a summary before committing
 */
export async function previewImport(
  userId: string,
  rows: BGGCollectionRow[],
  matchResult: MatchResult
): Promise<{
  wouldImport: number
  wouldUpdate: number
  wouldSkip: number
  unmatched: number
}> {
  const supabase = await createClient()

  if (matchResult.matched.length === 0) {
    return {
      wouldImport: 0,
      wouldUpdate: 0,
      wouldSkip: 0,
      unmatched: matchResult.unmatched.length,
    }
  }

  const bggToGameId = createBGGToGameIdMap(matchResult.matched)
  const gameIds = matchResult.matched.map((m) => m.gameId)

  const { data: existingGames } = await supabase
    .from('user_games')
    .select('game_id')
    .eq('user_id', userId)
    .in('game_id', gameIds)

  const existingSet = new Set((existingGames || []).map((g) => g.game_id))

  let wouldImport = 0
  let wouldUpdate = 0
  const seenGameIds = new Set<string>()

  for (const row of rows) {
    const gameId = bggToGameId.get(row.objectid)
    if (!gameId || seenGameIds.has(gameId)) continue
    seenGameIds.add(gameId)

    if (existingSet.has(gameId)) {
      wouldUpdate++
    } else {
      wouldImport++
    }
  }

  return {
    wouldImport,
    wouldUpdate,
    wouldSkip: 0, // Preview assumes overwrite mode
    unmatched: matchResult.unmatched.length,
  }
}
