/**
 * Award Importer from Wikidata
 *
 * Imports board game award winners from Wikidata into the game_awards table.
 * Games are matched by BGG ID. If a game exists in our database, the award
 * is linked to game_id. If not, the award is stored as "pending" with bgg_id
 * and game_name for display purposes.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { getWikidataAwardWinners, type WikidataAwardWinner } from './award-queries'

export interface AwardImportResult {
  total: number // Total awards from Wikidata
  imported: number // Successfully imported/updated
  linked: number // Matched to existing games
  pending: number // Stored with bgg_id (game not imported)
  skipped: number // Skipped (no BGG ID, no year, etc.)
  errors: string[]
}

/**
 * Import board game awards from Wikidata
 *
 * @param awardSlug - Optional: import only for a specific award (e.g., 'spiel-des-jahres')
 *
 * For each award winner:
 * 1. Check if game exists by BGG ID
 * 2. If yes: link to game_id
 * 3. If no: store with bgg_id + game_name for later linking
 */
export async function importAwardsFromWikidata(awardSlug?: string): Promise<AwardImportResult> {
  const supabase = createAdminClient()
  const result: AwardImportResult = {
    total: 0,
    imported: 0,
    linked: 0,
    pending: 0,
    skipped: 0,
    errors: [],
  }

  // Fetch award winners from Wikidata (optionally filtered by award)
  let winners: WikidataAwardWinner[]
  try {
    winners = await getWikidataAwardWinners(awardSlug)
    result.total = winners.length
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    result.errors.push(`Failed to fetch from Wikidata: ${message}`)
    return result
  }

  if (winners.length === 0) {
    return result
  }

  // Fetch all awards from database for mapping slug -> id
  const { data: awards, error: awardsError } = await supabase
    .from('awards')
    .select('id, slug')
    .eq('is_active', true)

  if (awardsError || !awards) {
    result.errors.push(`Failed to fetch awards: ${awardsError?.message}`)
    return result
  }

  const awardsBySlug = new Map(awards.map((a) => [a.slug, a.id]))

  // Get all games with BGG IDs for matching
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id, bgg_id')
    .not('bgg_id', 'is', null)

  if (gamesError) {
    result.errors.push(`Failed to fetch games: ${gamesError.message}`)
    return result
  }

  const gamesByBggId = new Map(
    (games || [])
      .filter((g) => g.bgg_id !== null)
      .map((g) => [g.bgg_id!, g.id])
  )

  console.log(
    `[Award Import] Processing ${winners.length} awards, ${gamesByBggId.size} games in DB`
  )

  // Process each award winner
  for (const winner of winners) {
    // Skip if no award slug mapping
    if (!winner.awardSlug) {
      result.skipped++
      continue
    }

    // Skip if award not in our database
    const awardId = awardsBySlug.get(winner.awardSlug)
    if (!awardId) {
      result.skipped++
      continue
    }

    // Skip if no year
    if (!winner.year) {
      result.skipped++
      continue
    }

    // Skip if no BGG ID (can't match or store for later)
    if (!winner.bggId) {
      result.skipped++
      continue
    }

    // Check if game exists in our database
    const gameId = gamesByBggId.get(winner.bggId)
    const isLinked = !!gameId

    // Prepare the upsert data
    const awardData = {
      game_id: gameId || null,
      bgg_id: gameId ? null : winner.bggId, // Only store bgg_id if not linked
      game_name: gameId ? null : winner.gameName, // Only store name if not linked
      wikidata_game_id: winner.wikidataGameId,
      award_id: awardId,
      category_id: null, // Wikidata doesn't give us category info
      year: winner.year,
      result: winner.isNominee ? 'nominated' : 'winner',
    }

    // Upsert the award
    const { error: upsertError } = await supabase.from('game_awards').upsert(
      awardData,
      {
        // Can't use standard onConflict with our new unique index
        // Use ignoreDuplicates: false to update existing records
        ignoreDuplicates: false,
      }
    )

    if (upsertError) {
      // Check if it's a duplicate error (expected for updates)
      if (upsertError.code === '23505') {
        // Unique violation - try update instead
        const { error: updateError } = await supabase
          .from('game_awards')
          .update({
            game_id: awardData.game_id,
            bgg_id: awardData.bgg_id,
            game_name: awardData.game_name,
            wikidata_game_id: awardData.wikidata_game_id,
            result: awardData.result,
          })
          .eq('award_id', awardId)
          .eq('year', winner.year)
          .or(
            gameId
              ? `game_id.eq.${gameId}`
              : `bgg_id.eq.${winner.bggId}`
          )

        if (updateError) {
          result.errors.push(
            `Failed to update ${winner.gameName} (${winner.year}): ${updateError.message}`
          )
        } else {
          result.imported++
          if (isLinked) result.linked++
          else result.pending++
        }
      } else {
        result.errors.push(
          `Failed to import ${winner.gameName} (${winner.year}): ${upsertError.message}`
        )
      }
    } else {
      result.imported++
      if (isLinked) result.linked++
      else result.pending++
    }
  }

  console.log(
    `[Award Import] Complete: ${result.imported} imported (${result.linked} linked, ${result.pending} pending), ${result.skipped} skipped, ${result.errors.length} errors`
  )

  return result
}

/**
 * Link pending awards to a newly imported game
 *
 * Called after a game is imported. Finds any pending awards with matching
 * BGG ID and updates them to link to the new game_id.
 *
 * @param gameId - The newly imported game's UUID
 * @param bggId - The game's BGG ID
 * @returns Number of awards linked
 */
export async function linkPendingAwards(
  gameId: string,
  bggId: number
): Promise<number> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('game_awards')
    .update({
      game_id: gameId,
      bgg_id: null, // Clear bgg_id since we now have game_id
      game_name: null, // Clear game_name since game is imported
    })
    .is('game_id', null)
    .eq('bgg_id', bggId)
    .select('id')

  if (error) {
    console.error(`[Award Import] Failed to link awards for BGG ${bggId}:`, error)
    return 0
  }

  const count = data?.length || 0
  if (count > 0) {
    console.log(`[Award Import] Linked ${count} pending awards to game ${gameId}`)
  }

  return count
}

/**
 * Get counts of awards by status
 */
export async function getAwardImportStats(): Promise<{
  total: number
  linked: number
  pending: number
  byAward: Array<{ slug: string; name: string; linked: number; pending: number }>
}> {
  const supabase = createAdminClient()

  // Get total counts
  const { count: total } = await supabase
    .from('game_awards')
    .select('*', { count: 'exact', head: true })

  const { count: linked } = await supabase
    .from('game_awards')
    .select('*', { count: 'exact', head: true })
    .not('game_id', 'is', null)

  const { count: pending } = await supabase
    .from('game_awards')
    .select('*', { count: 'exact', head: true })
    .is('game_id', null)

  // Get per-award breakdown
  const { data: awards } = await supabase
    .from('awards')
    .select('id, slug, name')
    .eq('is_active', true)
    .order('display_order')

  const byAward: Array<{ slug: string; name: string; linked: number; pending: number }> = []

  for (const award of awards || []) {
    const { count: awardLinked } = await supabase
      .from('game_awards')
      .select('*', { count: 'exact', head: true })
      .eq('award_id', award.id)
      .not('game_id', 'is', null)

    const { count: awardPending } = await supabase
      .from('game_awards')
      .select('*', { count: 'exact', head: true })
      .eq('award_id', award.id)
      .is('game_id', null)

    byAward.push({
      slug: award.slug,
      name: award.name,
      linked: awardLinked || 0,
      pending: awardPending || 0,
    })
  }

  return {
    total: total || 0,
    linked: linked || 0,
    pending: pending || 0,
    byAward,
  }
}
