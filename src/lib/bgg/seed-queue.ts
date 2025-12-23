/**
 * BGG Import Queue Seeder
 * Seeds the import queue with games from various sources
 */

import { createClient } from '@/lib/supabase/server'

interface QueueItem {
  bgg_id: number
  name: string | null
  source: 'bgg_top500' | 'award_winner' | 'manual'
  priority: number
}

/**
 * Add a single game to the import queue
 */
export async function addToQueue(
  bggId: number,
  source: 'bgg_top500' | 'award_winner' | 'manual',
  name?: string,
  priority: number = 3
): Promise<boolean> {
  const supabase = await createClient()

  // Check if already in queue or imported
  const { data: existing } = await supabase
    .from('import_queue')
    .select('id')
    .eq('bgg_id', bggId)
    .single()

  if (existing) {
    return false // Already queued
  }

  // Check if game already exists
  const { data: existingGame } = await supabase
    .from('games')
    .select('id')
    .eq('bgg_id', bggId)
    .single()

  if (existingGame) {
    return false // Already imported
  }

  // Add to queue
  const { error } = await supabase
    .from('import_queue')
    .insert({
      bgg_id: bggId,
      name: name || null,
      source,
      priority,
      status: 'pending'
    })

  return !error
}

/**
 * Seed queue from award winners in our database
 * These are high priority since we've already curated them
 */
export async function seedFromAwards(): Promise<{ added: number; skipped: number }> {
  const supabase = await createClient()

  // Get all games with BGG IDs that have won awards
  // First, get game IDs from game_awards
  const { data: gameAwards, error: awardsError } = await supabase
    .from('game_awards')
    .select('game_id')

  if (awardsError || !gameAwards) {
    console.error('Error fetching game awards:', awardsError)
    return { added: 0, skipped: 0 }
  }

  // Get unique game IDs (filter out nulls)
  const gameIds = [...new Set(gameAwards.map(ga => ga.game_id).filter((id): id is string => id !== null))]

  // Get games with BGG IDs
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('bgg_id, name')
    .in('id', gameIds)
    .not('bgg_id', 'is', null)

  if (gamesError || !games) {
    console.error('Error fetching games:', gamesError)
    return { added: 0, skipped: 0 }
  }

  let added = 0
  let skipped = 0

  for (const game of games) {
    if (game.bgg_id) {
      const wasAdded = await addToQueue(
        game.bgg_id,
        'award_winner',
        game.name,
        1  // High priority for award winners
      )
      if (wasAdded) added++
      else skipped++
    }
  }

  return { added, skipped }
}

/**
 * Seed queue with BGG Top N games
 * These are well-known games that users will search for
 */
export async function seedFromBGGTop(count: number = 100): Promise<{ added: number; skipped: number }> {
  // BGG Top 100 game IDs (as of late 2024)
  // These are manually curated from BGG's top games list
  const TOP_BGG_IDS = [
    // Top 10
    174430, // Gloomhaven
    161936, // Pandemic Legacy: Season 1
    224517, // Brass: Birmingham
    167791, // Terraforming Mars
    233078, // Twilight Imperium 4th Ed
    187645, // Star Wars: Rebellion
    169786, // Scythe
    182028, // Through the Ages: A New Story
    115746, // War of the Ring
    220308, // Gaia Project

    // 11-30
    12333,  // Twilight Struggle
    164928, // Orléans
    84876,  // The Castles of Burgundy
    31260,  // Agricola
    173346, // 7 Wonders Duel
    205637, // Arkham Horror LCG
    28720,  // Brass: Lancashire
    162886, // Spirit Island
    102794, // Caverna
    230802, // Azul

    // 31-50
    183394, // Viticulture Essential Edition
    193738, // Great Western Trail
    3076,   // Puerto Rico
    68448,  // 7 Wonders
    2651,   // Power Grid
    35677,  // Le Havre
    126163, // Tzolkin
    25613,  // Through the Ages
    237182, // Root
    175914, // Food Chain Magnate

    // 51-70
    199792, // Everdell
    36218,  // Dominion
    170216, // Blood Rage
    110327, // Lords of Waterdeep
    124361, // Concordia
    172818, // Above and Below
    121921, // Robinson Crusoe
    150376, // Dead of Winter
    148228, // Splendor
    172386, // Mombasa

    // 71-100
    209010, // Mechs vs Minions
    155821, // Inis
    185343, // Anachrony
    154203, // Imperial Settlers
    163412, // Patchwork
    167355, // Nemesis
    266192, // Wingspan
    221107, // Pandemic Legacy: Season 2
    184267, // On Mars
    256960, // Pax Pamir 2nd Ed
    295947, // Maracaibo
    262712, // Res Arcana
    199561, // Sagrada
    161533, // Lisboa
    175155, // The Gallerist
    171623, // The Voyages of Marco Polo
    203416, // Lorenzo il Magnifico
    192291, // Too Many Bones
    157354, // Five Tribes
    104162, // Descent 2nd Ed
  ]

  const idsToAdd = TOP_BGG_IDS.slice(0, count)

  let added = 0
  let skipped = 0

  for (let i = 0; i < idsToAdd.length; i++) {
    const bggId = idsToAdd[i]
    const priority = Math.floor(i / 20) + 2  // Priority 2-7 based on rank

    const wasAdded = await addToQueue(
      bggId,
      'bgg_top500',
      undefined,
      priority
    )
    if (wasAdded) added++
    else skipped++
  }

  return { added, skipped }
}

/**
 * Manually add specific BGG IDs to the queue
 */
export async function seedManual(
  bggIds: number[],
  priority: number = 3
): Promise<{ added: number; skipped: number }> {
  let added = 0
  let skipped = 0

  for (const bggId of bggIds) {
    const wasAdded = await addToQueue(bggId, 'manual', undefined, priority)
    if (wasAdded) added++
    else skipped++
  }

  return { added, skipped }
}

/**
 * Clear failed imports from queue (to retry them)
 */
export async function resetFailedImports(): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('import_queue')
    .update({
      status: 'pending',
      attempts: 0,
      error_message: null
    })
    .eq('status', 'failed')
    .select('id')

  if (error) {
    console.error('Error resetting failed imports:', error)
    return 0
  }

  return data?.length || 0
}

/**
 * Get queue summary
 */
export async function getQueueSummary(): Promise<{
  bySource: Record<string, number>
  byStatus: Record<string, number>
  total: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('import_queue')
    .select('source, status')

  if (error || !data) {
    return { bySource: {}, byStatus: {}, total: 0 }
  }

  const bySource: Record<string, number> = {}
  const byStatus: Record<string, number> = {}

  for (const item of data) {
    bySource[item.source] = (bySource[item.source] || 0) + 1
    const status = item.status || 'unknown'
    byStatus[status] = (byStatus[status] || 0) + 1
  }

  return { bySource, byStatus, total: data.length }
}
