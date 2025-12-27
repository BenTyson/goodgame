/**
 * BGG Game Importer
 * Transforms BGG data and imports into our database
 */

import { createClient } from '@/lib/supabase/server'
import { fetchBGGGame, type BGGRawGame } from './client'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { RelationType } from '@/types/database'

type GameInsert = Database['public']['Tables']['games']['Insert']
type ImportQueueRow = Database['public']['Tables']['import_queue']['Row']

/**
 * BGG Family types we care about for game series
 * BGG has many family types (themes, components, etc) - we only want game series
 */
const SERIES_FAMILY_PREFIXES = [
  'Game:',      // e.g., "Game: Catan", "Game: Pandemic"
  'Series:',    // e.g., "Series: Ticket to Ride"
]

/**
 * Check if a BGG family represents a game series (not a theme/mechanism/etc)
 */
function isGameSeriesFamily(familyName: string): boolean {
  return SERIES_FAMILY_PREFIXES.some(prefix => familyName.startsWith(prefix))
}

/**
 * Clean BGG family name to our format
 * "Game: Catan" -> "Catan"
 * "Series: Ticket to Ride" -> "Ticket to Ride"
 */
function cleanFamilyName(familyName: string): string {
  for (const prefix of SERIES_FAMILY_PREFIXES) {
    if (familyName.startsWith(prefix)) {
      return familyName.substring(prefix.length).trim()
    }
  }
  return familyName
}

/**
 * Result of an import operation
 */
export interface ImportResult {
  success: boolean
  gameId?: string
  slug?: string
  error?: string
  bggId: number
  name?: string
}

/**
 * Generate a URL-safe slug from a game name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')           // Remove apostrophes
    .replace(/[&]/g, 'and')          // Replace & with 'and'
    .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')         // Trim leading/trailing hyphens
    .replace(/-+/g, '-')             // Collapse multiple hyphens
}

/**
 * Upsert a designer and return their ID
 */
async function upsertDesigner(
  supabase: SupabaseClient<Database>,
  name: string
): Promise<string | null> {
  const slug = generateSlug(name)

  // Try to find existing designer
  const { data: existing } = await supabase
    .from('designers')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) return existing.id

  // Create new designer
  const { data: newDesigner, error } = await supabase
    .from('designers')
    .insert({ slug, name })
    .select('id')
    .single()

  if (error || !newDesigner) return null
  return newDesigner.id
}

/**
 * Upsert a publisher and return their ID
 */
async function upsertPublisher(
  supabase: SupabaseClient<Database>,
  name: string
): Promise<string | null> {
  const slug = generateSlug(name)

  const { data: existing } = await supabase
    .from('publishers')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) return existing.id

  const { data: newPublisher, error } = await supabase
    .from('publishers')
    .insert({ slug, name })
    .select('id')
    .single()

  if (error || !newPublisher) return null
  return newPublisher.id
}

/**
 * Upsert an artist and return their ID
 */
async function upsertArtist(
  supabase: SupabaseClient<Database>,
  name: string
): Promise<string | null> {
  const slug = generateSlug(name)

  const { data: existing } = await supabase
    .from('artists')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) return existing.id

  const { data: newArtist, error } = await supabase
    .from('artists')
    .insert({ slug, name })
    .select('id')
    .single()

  if (error || !newArtist) return null
  return newArtist.id
}

/**
 * Upsert a mechanic and return their ID
 */
async function upsertMechanic(
  supabase: SupabaseClient<Database>,
  name: string
): Promise<string | null> {
  const slug = generateSlug(name)

  const { data: existing } = await supabase
    .from('mechanics')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) return existing.id

  const { data: newMechanic, error } = await supabase
    .from('mechanics')
    .insert({ slug, name })
    .select('id')
    .single()

  if (error || !newMechanic) return null
  return newMechanic.id
}

/**
 * Upsert a game family based on BGG family data and return the ID
 * Only creates families for game series (not themes, mechanisms, etc.)
 */
async function upsertGameFamily(
  supabase: SupabaseClient<Database>,
  bggFamilyId: number,
  bggFamilyName: string
): Promise<string | null> {
  // Only process game series families
  if (!isGameSeriesFamily(bggFamilyName)) {
    return null
  }

  const cleanName = cleanFamilyName(bggFamilyName)
  const slug = generateSlug(cleanName)

  // Try to find by BGG family ID first (most reliable)
  const { data: existingById } = await supabase
    .from('game_families')
    .select('id')
    .eq('bgg_family_id', bggFamilyId)
    .single()

  if (existingById) return existingById.id

  // Fall back to slug match
  const { data: existingBySlug } = await supabase
    .from('game_families')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existingBySlug) {
    // Update with BGG ID for future matching
    await supabase
      .from('game_families')
      .update({ bgg_family_id: bggFamilyId })
      .eq('id', existingBySlug.id)
    return existingBySlug.id
  }

  // Create new family
  const { data: newFamily, error } = await supabase
    .from('game_families')
    .insert({
      slug,
      name: cleanName,
      bgg_family_id: bggFamilyId,
    })
    .select('id')
    .single()

  if (error || !newFamily) {
    console.error(`Failed to create family "${cleanName}":`, error?.message)
    return null
  }

  return newFamily.id
}

/**
 * Link a game to its family based on BGG family data
 * Picks the first game series family from BGG
 */
async function linkGameFamily(
  supabase: SupabaseClient<Database>,
  gameId: string,
  bggFamilies: { id: number; name: string }[]
): Promise<void> {
  // Find the first game series family
  const seriesFamily = bggFamilies.find(f => isGameSeriesFamily(f.name))

  if (!seriesFamily) return

  const familyId = await upsertGameFamily(supabase, seriesFamily.id, seriesFamily.name)

  if (familyId) {
    await supabase
      .from('games')
      .update({ family_id: familyId })
      .eq('id', gameId)
  }
}

/**
 * Create expansion relation if the base game exists in our database
 */
async function linkExpansionRelation(
  supabase: SupabaseClient<Database>,
  expansionGameId: string,
  baseGameBggId: number
): Promise<void> {
  // Find the base game by BGG ID
  const { data: baseGame } = await supabase
    .from('games')
    .select('id')
    .eq('bgg_id', baseGameBggId)
    .single()

  if (!baseGame) {
    // Base game not in our DB yet - relation will be created when it's imported
    return
  }

  // Check if relation already exists
  const { data: existing } = await supabase
    .from('game_relations')
    .select('id')
    .eq('source_game_id', expansionGameId)
    .eq('target_game_id', baseGame.id)
    .single()

  if (existing) return

  // Create expansion_of relation
  await supabase
    .from('game_relations')
    .insert({
      source_game_id: expansionGameId,
      target_game_id: baseGame.id,
      relation_type: 'expansion_of' as RelationType,
    })
}

/**
 * Create relations for a base game's expansions that already exist in our DB
 */
async function linkBaseGameExpansions(
  supabase: SupabaseClient<Database>,
  baseGameId: string,
  expansionBggIds: number[]
): Promise<void> {
  if (expansionBggIds.length === 0) return

  // Find expansions that exist in our DB
  const { data: expansions } = await supabase
    .from('games')
    .select('id, bgg_id')
    .in('bgg_id', expansionBggIds)

  if (!expansions || expansions.length === 0) return

  for (const expansion of expansions) {
    // Check if relation already exists (expansion -> base)
    const { data: existing } = await supabase
      .from('game_relations')
      .select('id')
      .eq('source_game_id', expansion.id)
      .eq('target_game_id', baseGameId)
      .single()

    if (existing) continue

    // Create expansion_of relation (expansion is source, base is target)
    await supabase
      .from('game_relations')
      .insert({
        source_game_id: expansion.id,
        target_game_id: baseGameId,
        relation_type: 'expansion_of' as RelationType,
      })
  }
}

/**
 * Link a game to its designers
 */
async function linkGameDesigners(
  supabase: SupabaseClient<Database>,
  gameId: string,
  designerNames: string[]
): Promise<void> {
  for (const [index, name] of designerNames.entries()) {
    const designerId = await upsertDesigner(supabase, name)
    if (designerId) {
      await supabase
        .from('game_designers')
        .upsert({
          game_id: gameId,
          designer_id: designerId,
          is_primary: index === 0,
          display_order: index
        })
    }
  }
}

/**
 * Link a game to its publishers
 */
async function linkGamePublishers(
  supabase: SupabaseClient<Database>,
  gameId: string,
  publisherNames: string[]
): Promise<void> {
  for (const [index, name] of publisherNames.entries()) {
    const publisherId = await upsertPublisher(supabase, name)
    if (publisherId) {
      await supabase
        .from('game_publishers')
        .upsert({
          game_id: gameId,
          publisher_id: publisherId,
          is_primary: index === 0,
          display_order: index
        })
    }
  }
}

/**
 * Link a game to its artists
 */
async function linkGameArtists(
  supabase: SupabaseClient<Database>,
  gameId: string,
  artistNames: string[]
): Promise<void> {
  for (const [index, name] of artistNames.entries()) {
    const artistId = await upsertArtist(supabase, name)
    if (artistId) {
      await supabase
        .from('game_artists')
        .upsert({
          game_id: gameId,
          artist_id: artistId,
          display_order: index
        })
    }
  }
}

/**
 * Link a game to its mechanics
 */
async function linkGameMechanics(
  supabase: SupabaseClient<Database>,
  gameId: string,
  mechanicNames: string[]
): Promise<void> {
  for (const name of mechanicNames) {
    const mechanicId = await upsertMechanic(supabase, name)
    if (mechanicId) {
      await supabase
        .from('game_mechanics')
        .upsert({
          game_id: gameId,
          mechanic_id: mechanicId
        })
    }
  }
}

/**
 * Clean and truncate BGG description
 */
function cleanDescription(description: string): string {
  // BGG descriptions often have HTML entities
  let cleaned = description
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#10;/g, '\n')
    .replace(/<[^>]*>/g, '')  // Strip HTML tags
    .trim()

  // Truncate to reasonable length for our short_description
  if (cleaned.length > 500) {
    cleaned = cleaned.substring(0, 497) + '...'
  }

  return cleaned
}

/**
 * Map BGG categories to our category slugs
 */
const BGG_CATEGORY_MAP: Record<string, string> = {
  // Strategy
  'Abstract Strategy': 'strategy',
  'Economic': 'strategy',
  'City Building': 'strategy',
  'Territory Building': 'strategy',

  // Family
  'Family Game': 'family-games',
  "Children's Game": 'family-games',
  'Party Game': 'party-games',

  // Thematic
  'Adventure': 'thematic',
  'Horror': 'thematic',
  'Fantasy': 'thematic',
  'Science Fiction': 'thematic',
  'Exploration': 'thematic',

  // Card Games
  'Card Game': 'card-games',
  'Collectible Components': 'card-games',

  // Cooperative
  'Cooperative': 'cooperative',
  'Solo / Solitaire Game': 'cooperative',

  // Word/Trivia
  'Word Game': 'word-games',
  'Trivia': 'word-games',
  'Deduction': 'word-games',

  // Dice
  'Dice': 'dice-games',
}

/**
 * Transform BGG raw data to our game insert format
 */
export function transformBGGToGame(bgg: BGGRawGame): GameInsert {
  const slug = generateSlug(bgg.name)

  return {
    slug,
    name: bgg.name,
    bgg_id: bgg.id,
    tagline: cleanDescription(bgg.description).substring(0, 200),
    description: bgg.description,
    // NOTE: Not importing BGG images - they don't work reliably with Next.js image optimization
    // Images should be uploaded manually via admin panel
    box_image_url: null,
    thumbnail_url: null,
    player_count_min: bgg.minPlayers,
    player_count_max: bgg.maxPlayers,
    play_time_min: bgg.minPlayTime,
    play_time_max: bgg.maxPlayTime,
    min_age: bgg.minAge,
    weight: bgg.weight,  // BGG weight = complexity
    year_published: bgg.yearPublished,
    designers: bgg.designers.slice(0, 5),
    publisher: bgg.publishers[0] || null,
    is_published: false,           // Always start unpublished
    is_featured: false,
    has_score_sheet: false,
    content_status: 'none',        // No AI content yet
    priority: 3,                   // Default priority
    bgg_raw_data: JSON.parse(JSON.stringify(bgg)), // Store full BGG data as JSON
    bgg_last_synced: new Date().toISOString(),
  }
}

/**
 * Import a single game from BGG
 */
export async function importGameFromBGG(bggId: number): Promise<ImportResult> {
  const supabase = await createClient()

  // Check if already imported
  const { data: existing } = await supabase
    .from('games')
    .select('id, slug')
    .eq('bgg_id', bggId)
    .single()

  if (existing) {
    return {
      success: true,
      gameId: existing.id,
      slug: existing.slug,
      bggId,
      error: 'Game already exists'
    }
  }

  // Fetch from BGG
  const bggData = await fetchBGGGame(bggId)

  if (!bggData) {
    return {
      success: false,
      bggId,
      error: 'Failed to fetch from BGG'
    }
  }

  // Transform data
  const gameData = transformBGGToGame(bggData)

  // Check for slug collision
  let finalSlug = gameData.slug!
  let slugSuffix = 0
  while (true) {
    const { data: slugCheck } = await supabase
      .from('games')
      .select('id')
      .eq('slug', finalSlug)
      .single()

    if (!slugCheck) break

    slugSuffix++
    finalSlug = `${gameData.slug}-${slugSuffix}`
  }
  gameData.slug = finalSlug

  // Insert game
  const { data: newGame, error: insertError } = await supabase
    .from('games')
    .insert(gameData)
    .select('id, slug')
    .single()

  if (insertError || !newGame) {
    return {
      success: false,
      bggId,
      name: bggData.name,
      error: insertError?.message || 'Insert failed'
    }
  }

  // Link to categories based on BGG categories
  await linkGameToCategories(newGame.id, bggData.categories)

  // Link to designers, publishers, artists, and mechanics
  if (bggData.designers.length > 0) {
    await linkGameDesigners(supabase, newGame.id, bggData.designers)
  }
  if (bggData.publishers.length > 0) {
    await linkGamePublishers(supabase, newGame.id, bggData.publishers)
  }
  if (bggData.artists.length > 0) {
    await linkGameArtists(supabase, newGame.id, bggData.artists)
  }
  if (bggData.mechanics.length > 0) {
    await linkGameMechanics(supabase, newGame.id, bggData.mechanics)
  }

  // Link to game family (series) if applicable
  if (bggData.families.length > 0) {
    await linkGameFamily(supabase, newGame.id, bggData.families)
  }

  // Create expansion relations
  // If this game is an expansion, link to base game
  if (bggData.expandsGame) {
    await linkExpansionRelation(supabase, newGame.id, bggData.expandsGame.id)
  }

  // If this is a base game, link any existing expansions in our DB
  if (bggData.expansions.length > 0) {
    const expansionBggIds = bggData.expansions.map(e => e.id)
    await linkBaseGameExpansions(supabase, newGame.id, expansionBggIds)
  }

  return {
    success: true,
    gameId: newGame.id,
    slug: newGame.slug,
    bggId,
    name: bggData.name
  }
}

/**
 * Link a game to categories based on BGG category names
 */
async function linkGameToCategories(gameId: string, bggCategories: string[]): Promise<void> {
  const supabase = await createClient()

  // Get our category slugs
  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug')

  if (!categories) return

  const categoryMap = new Map(categories.map(c => [c.slug, c.id]))

  // Find matching categories
  const matchedCategories: string[] = []
  for (const bggCat of bggCategories) {
    const ourSlug = BGG_CATEGORY_MAP[bggCat]
    if (ourSlug && categoryMap.has(ourSlug) && !matchedCategories.includes(ourSlug)) {
      matchedCategories.push(ourSlug)
    }
  }

  // Insert category links
  if (matchedCategories.length > 0) {
    const links = matchedCategories.map((slug, index) => ({
      game_id: gameId,
      category_id: categoryMap.get(slug)!,
      is_primary: index === 0  // First match is primary
    }))

    await supabase.from('game_categories').insert(links)
  }
}

/**
 * Process the import queue - import next batch of pending games
 */
export async function importNextBatch(limit: number = 5): Promise<ImportResult[]> {
  const supabase = await createClient()

  // Get next pending items, ordered by priority (lower = higher priority)
  const { data: queue, error: queueError } = await supabase
    .from('import_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(limit)

  if (queueError || !queue || queue.length === 0) {
    return []
  }

  const results: ImportResult[] = []

  for (const item of queue) {
    // Mark as importing
    await supabase
      .from('import_queue')
      .update({
        status: 'importing',
        attempts: (item.attempts || 0) + 1
      })
      .eq('id', item.id)

    // Import the game
    const result = await importGameFromBGG(item.bgg_id)
    results.push(result)

    // Update queue status
    if (result.success) {
      await supabase
        .from('import_queue')
        .update({
          status: 'imported',
          imported_game_id: result.gameId,
          error_message: null
        })
        .eq('id', item.id)
    } else {
      // Mark as failed (or pending if we want to retry)
      const shouldRetry = (item.attempts || 0) < 3
      await supabase
        .from('import_queue')
        .update({
          status: shouldRetry ? 'pending' : 'failed',
          error_message: result.error
        })
        .eq('id', item.id)
    }
  }

  return results
}

/**
 * Update an existing game with fresh BGG data
 */
export async function syncGameWithBGG(gameId: string): Promise<ImportResult> {
  const supabase = await createClient()

  // Get game's BGG ID
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id, slug, bgg_id')
    .eq('id', gameId)
    .single()

  if (gameError || !game || !game.bgg_id) {
    return {
      success: false,
      bggId: 0,
      error: 'Game not found or no BGG ID'
    }
  }

  // Fetch fresh data from BGG
  const bggData = await fetchBGGGame(game.bgg_id)

  if (!bggData) {
    return {
      success: false,
      bggId: game.bgg_id,
      error: 'Failed to fetch from BGG'
    }
  }

  // Update only BGG-sourced fields (not our content, settings, or images)
  // NOTE: Not syncing BGG images - they don't work reliably with Next.js image optimization
  const { error: updateError } = await supabase
    .from('games')
    .update({
      weight: bggData.weight,
      bgg_raw_data: JSON.parse(JSON.stringify(bggData)),
      bgg_last_synced: new Date().toISOString(),
    })
    .eq('id', gameId)

  if (updateError) {
    return {
      success: false,
      bggId: game.bgg_id,
      error: updateError.message
    }
  }

  return {
    success: true,
    gameId: game.id,
    slug: game.slug,
    bggId: game.bgg_id,
    name: bggData.name
  }
}

/**
 * Get import queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number
  importing: number
  imported: number
  failed: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('import_queue')
    .select('status')

  if (error || !data) {
    return { pending: 0, importing: 0, imported: 0, failed: 0 }
  }

  return {
    pending: data.filter(d => d.status === 'pending').length,
    importing: data.filter(d => d.status === 'importing').length,
    imported: data.filter(d => d.status === 'imported').length,
    failed: data.filter(d => d.status === 'failed').length,
  }
}
