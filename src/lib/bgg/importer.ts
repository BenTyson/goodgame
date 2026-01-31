/**
 * BGG Game Importer
 * Transforms BGG data and imports into our database
 */

import { createAdminClient } from '@/lib/supabase/admin'
import {
  fetchBGGGameWithStatus,
  type ConsolidatedGameData,
  type BGGRawGame,
  type BGGLink,
  type BGGFetchResult,
  type PuffinPublisherData,
} from './client'
import {
  mapPuffinEnrichmentToGameUpdate,
  extractRelationData,
  determineVecnaStateFromPuffin,
} from './enrichment-mapper'
import { importContentForSingleGame } from './content-importer'

/**
 * Fetch a game from Puffin with automatic retry for pending games
 * Retries up to 6 times with 5-second delays (30 seconds total wait)
 */
async function fetchWithRetry(bggId: number, maxRetries = 6, delayMs = 5000): Promise<BGGFetchResult> {
  let lastResult = await fetchBGGGameWithStatus(bggId)

  if (lastResult.status !== 'pending') {
    return lastResult
  }

  // Game is pending in Puffin - retry with delays
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Game ${bggId} pending in Puffin, waiting ${delayMs}ms (attempt ${attempt}/${maxRetries})...`)
    await new Promise(resolve => setTimeout(resolve, delayMs))

    lastResult = await fetchBGGGameWithStatus(bggId)

    if (lastResult.status !== 'pending') {
      return lastResult
    }
  }

  // Still pending after all retries
  return {
    game: null,
    status: 'pending',
    message: `Game ${bggId} is still being fetched after ${maxRetries * delayMs / 1000}s. Please try again later.`
  }
}
import { generateSlug } from '@/lib/utils/slug'
import { BGG_CATEGORY_MAP, getBGGThemeSlugs, getBGGExperienceSlugs } from '@/lib/config/bgg-mappings'
import { resolveBGGAliases } from '@/lib/supabase/category-queries'
import { linkPendingAwards } from '@/lib/wikidata/award-importer'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { RelationType } from '@/types/database'

type GameInsert = Database['public']['Tables']['games']['Insert']
type ImportQueueRow = Database['public']['Tables']['import_queue']['Row']

/**
 * Options for game import
 */
export interface ImportOptions {
  /** Import parent games (base game for expansions, original for reimplementations) first */
  importParents?: boolean
  /** Maximum depth for parent chasing (default: 3) */
  maxDepth?: number
  /** Track which BGG IDs are currently being imported (to prevent circular imports) */
  importingSet?: Set<number>
}

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
 * Uses Puffin-provided publisher data for enrichment
 */
async function upsertPublisher(
  supabase: SupabaseClient<Database>,
  name: string,
  puffinData?: PuffinPublisherData
): Promise<string | null> {
  const slug = generateSlug(name)

  const { data: existing } = await supabase
    .from('publishers')
    .select('id, website')
    .eq('slug', slug)
    .single()

  // If publisher exists and has website, return it
  if (existing?.website) return existing.id

  // Use Puffin-provided enrichment data (from Wikidata via Puffin)
  const enrichmentData = {
    website: puffinData?.website || null,
    description: puffinData?.description || null,
  }

  if (puffinData?.website) {
    console.log(`  [Puffin] Found website for ${name}: ${puffinData.website}`)
  }

  // If publisher exists but missing website, update it
  if (existing) {
    if (enrichmentData.website) {
      await supabase
        .from('publishers')
        .update({
          website: enrichmentData.website,
          description: enrichmentData.description || undefined,
        })
        .eq('id', existing.id)
    }
    return existing.id
  }

  // Create new publisher with Puffin enrichment
  const { data: newPublisher, error } = await supabase
    .from('publishers')
    .insert({
      slug,
      name,
      website: enrichmentData.website,
      description: enrichmentData.description,
    })
    .select('id')
    .single()

  if (error || !newPublisher) return null
  return newPublisher.id
}

// NOTE: Local enrichment (enrichGameParallel) replaced by Puffin pre-enrichment
// Puffin caches enrichment data from Wikidata, Wikipedia, and Commons for faster imports

/**
 * Link a game to a family based on Wikidata series (P179)
 * If game already has a family from BGG, updates that family's wikidata_series_id
 * Otherwise creates/links a new family from the Wikidata series
 */
async function linkFamilyFromWikidataSeries(
  gameId: string,
  data: { seriesId?: string; seriesName?: string }
): Promise<void> {
  if (!data.seriesId) return

  const supabase = createAdminClient()
  const seriesId = data.seriesId
  const seriesName = data.seriesName || 'Unknown Series'
  // Check if game already has a family (from BGG)
  const { data: game } = await supabase
    .from('games')
    .select('family_id')
    .eq('id', gameId)
    .single()

  if (game?.family_id) {
    // Game has BGG family - update that family's wikidata_series_id if not set
    const { data: existingFamily } = await supabase
      .from('game_families')
      .select('id, wikidata_series_id')
      .eq('id', game.family_id)
      .single()

    if (existingFamily && !existingFamily.wikidata_series_id) {
      await supabase
        .from('game_families')
        .update({ wikidata_series_id: seriesId })
        .eq('id', existingFamily.id)
      console.log(`  [Wikidata] Updated BGG family with Wikidata series ID: ${seriesId}`)
    } else {
      console.log(`  [Wikidata] Game already has family from BGG (series ID already set or family not found)`)
    }
    return
  }

  // Try to find existing family by Wikidata series ID
  const { data: existingFamily } = await supabase
    .from('game_families')
    .select('id')
    .eq('wikidata_series_id', seriesId)
    .single()

  if (existingFamily) {
    // Link to existing family
    await supabase
      .from('games')
      .update({ family_id: existingFamily.id })
      .eq('id', gameId)
    console.log(`  [Wikidata] Linked to existing Wikidata series family`)
    return
  }

  // Create new family from Wikidata series
  const slug = generateSlug(seriesName)

  // Check if slug already exists
  const { data: familyBySlug } = await supabase
    .from('game_families')
    .select('id')
    .eq('slug', slug)
    .single()

  if (familyBySlug) {
    // Update existing family with Wikidata series ID and link game
    await supabase
      .from('game_families')
      .update({ wikidata_series_id: seriesId })
      .eq('id', familyBySlug.id)

    await supabase
      .from('games')
      .update({ family_id: familyBySlug.id })
      .eq('id', gameId)

    console.log(`  [Wikidata] Linked to existing family by slug, added Wikidata series ID`)
    return
  }

  // Create new family
  const { data: newFamily, error } = await supabase
    .from('game_families')
    .insert({
      slug,
      name: seriesName,
      wikidata_series_id: seriesId,
    })
    .select('id')
    .single()

  if (error || !newFamily) {
    console.warn(`  [Wikidata] Failed to create family from series:`, error?.message)
    return
  }

  // Link game to new family
  await supabase
    .from('games')
    .update({ family_id: newFamily.id })
    .eq('id', gameId)

  console.log(`  [Wikidata] Created new family from series: ${seriesName}`)
}

/**
 * Create sequel relationships based on Wikidata P155/P156 properties
 */
async function createWikidataSequelRelations(
  gameId: string,
  data: { followsBggId?: number; followedByBggId?: number }
): Promise<void> {
  if (!data.followsBggId && !data.followedByBggId) return

  const supabase = createAdminClient()

  // If this game follows another (is a sequel to)
  if (data.followsBggId) {
    const { data: targetGame } = await supabase
      .from('games')
      .select('id')
      .eq('bgg_id', data.followsBggId)
      .single()

    if (targetGame) {
      // Check if relation already exists
      const { data: existing } = await supabase
        .from('game_relations')
        .select('id')
        .eq('source_game_id', gameId)
        .eq('target_game_id', targetGame.id)
        .eq('relation_type', 'sequel_to')
        .single()

      if (!existing) {
        await supabase
          .from('game_relations')
          .insert({
            source_game_id: gameId,
            target_game_id: targetGame.id,
            relation_type: 'sequel_to' as RelationType,
          })
        console.log(`  [Wikidata] Created sequel_to relation to BGG ${data.followsBggId}`)
      }
    }
  }

  // If this game is followed by another (has a sequel)
  if (data.followedByBggId) {
    const { data: sourceGame } = await supabase
      .from('games')
      .select('id')
      .eq('bgg_id', data.followedByBggId)
      .single()

    if (sourceGame) {
      // Check if relation already exists (sequel_to from the other game)
      const { data: existing } = await supabase
        .from('game_relations')
        .select('id')
        .eq('source_game_id', sourceGame.id)
        .eq('target_game_id', gameId)
        .eq('relation_type', 'sequel_to')
        .single()

      if (!existing) {
        await supabase
          .from('game_relations')
          .insert({
            source_game_id: sourceGame.id,
            target_game_id: gameId,
            relation_type: 'sequel_to' as RelationType,
          })
        console.log(`  [Wikidata] Created sequel_to relation from BGG ${data.followedByBggId}`)
      }
    }
  }
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
 * Create reimplementation relation if the original game exists in our database
 * Includes year validation to prevent impossible relations (can't reimplement a future game)
 */
async function linkImplementationRelation(
  supabase: SupabaseClient<Database>,
  reimplementationGameId: string,
  originalGameBggId: number,
  reimplementationYear?: number | null
): Promise<void> {
  // Find the original game by BGG ID
  const { data: originalGame } = await supabase
    .from('games')
    .select('id, name, year_published')
    .eq('bgg_id', originalGameBggId)
    .single()

  if (!originalGame) {
    // Original game not in our DB yet - relation will be created when it's imported
    return
  }

  // Year validation: a game cannot be a reimplementation of a game published after it
  if (reimplementationYear && originalGame.year_published) {
    if (reimplementationYear < originalGame.year_published) {
      console.warn(`[Importer] Skipping invalid reimplementation relation: ` +
        `cannot reimplement "${originalGame.name}" (${originalGame.year_published}) ` +
        `from a game published in ${reimplementationYear}. BGG data may be incorrect.`)
      return
    }
  }

  // Check if relation already exists
  const { data: existing } = await supabase
    .from('game_relations')
    .select('id')
    .eq('source_game_id', reimplementationGameId)
    .eq('target_game_id', originalGame.id)
    .eq('relation_type', 'reimplementation_of')
    .single()

  if (existing) return

  // Create reimplementation_of relation
  await supabase
    .from('game_relations')
    .insert({
      source_game_id: reimplementationGameId,
      target_game_id: originalGame.id,
      relation_type: 'reimplementation_of' as RelationType,
    })
}

/**
 * Create relations for an original game's reimplementations that already exist in our DB
 * Includes year validation to prevent impossible relations
 */
async function linkOriginalGameImplementations(
  supabase: SupabaseClient<Database>,
  originalGameId: string,
  reimplementationBggIds: number[],
  originalYear?: number | null
): Promise<void> {
  if (reimplementationBggIds.length === 0) return

  // Find reimplementations that exist in our DB
  const { data: reimplementations } = await supabase
    .from('games')
    .select('id, bgg_id, name, year_published')
    .in('bgg_id', reimplementationBggIds)

  if (!reimplementations || reimplementations.length === 0) return

  for (const reimplementation of reimplementations) {
    // Year validation: the reimplementation should have a year >= original's year
    if (originalYear && reimplementation.year_published) {
      if (reimplementation.year_published < originalYear) {
        console.warn(`[Importer] Skipping invalid reimplementation relation: ` +
          `"${reimplementation.name}" (${reimplementation.year_published}) cannot be a reimplementation ` +
          `of a game published in ${originalYear}. BGG data may be incorrect.`)
        continue
      }
    }

    // Check if relation already exists (reimplementation -> original)
    const { data: existing } = await supabase
      .from('game_relations')
      .select('id')
      .eq('source_game_id', reimplementation.id)
      .eq('target_game_id', originalGameId)
      .eq('relation_type', 'reimplementation_of')
      .single()

    if (existing) continue

    // Create reimplementation_of relation (reimplementation is source, original is target)
    await supabase
      .from('game_relations')
      .insert({
        source_game_id: reimplementation.id,
        target_game_id: originalGameId,
        relation_type: 'reimplementation_of' as RelationType,
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
 * Uses Puffin-provided publisher data for enrichment when available
 */
async function linkGamePublishers(
  supabase: SupabaseClient<Database>,
  gameId: string,
  publisherNames: string[],
  puffinPublishers?: PuffinPublisherData[]
): Promise<void> {
  // Create a map of publisher name -> Puffin data for quick lookup
  const puffinDataMap = new Map<string, PuffinPublisherData>()
  if (puffinPublishers) {
    for (const pub of puffinPublishers) {
      puffinDataMap.set(pub.name.toLowerCase(), pub)
    }
  }

  for (const [index, name] of publisherNames.entries()) {
    // Find matching Puffin data by name (case-insensitive)
    const puffinData = puffinDataMap.get(name.toLowerCase())
    const publisherId = await upsertPublisher(supabase, name, puffinData)
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

// BGG category mappings are defined in @/lib/config/bgg-mappings.ts

/**
 * Track unmapped BGG tags for visibility and future mapping improvements
 */
async function trackUnmappedBGGTags(
  supabase: SupabaseClient<Database>,
  bggId: number,
  unmappedTags: { name: string; type: 'category' | 'mechanic' }[]
): Promise<void> {
  if (unmappedTags.length === 0) return

  // Log unmapped tags for visibility
  const tagList = unmappedTags.map(t => t.name).join(', ')
  console.log(`  [Taxonomy] ${unmappedTags.length} unmapped BGG tags: [${tagList}]`)

  // Upsert into tracking table (if it exists)
  // Uses raw query to avoid TypeScript errors before migration is applied
  try {
    for (const tag of unmappedTags) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('track_unmapped_bgg_tag', {
        p_bgg_id: bggId,
        p_bgg_name: tag.name,
        p_bgg_type: tag.type,
      })
    }
  } catch {
    // Silently ignore if tracking table/function doesn't exist yet
  }
}

/**
 * Check if a game exists in our database by BGG ID
 */
async function gameExistsByBggId(
  supabase: SupabaseClient<Database>,
  bggId: number
): Promise<boolean> {
  const { data } = await supabase
    .from('games')
    .select('id')
    .eq('bgg_id', bggId)
    .single()
  return !!data
}

/**
 * Import parent games first (base game for expansions, original for reimplementations)
 * This ensures relations can be created properly during the main import
 */
async function importParentGamesFirst(
  bggData: BGGRawGame,
  options: ImportOptions
): Promise<void> {
  const { maxDepth = 3, importingSet = new Set() } = options

  // Prevent infinite recursion (maxDepth of 0 means unlimited)
  if (maxDepth < 0) {
    console.log(`[Importer] Max depth reached, skipping parent import for ${bggData.name}`)
    return
  }

  // Use effective depth: 0 means unlimited (use large number)
  const effectiveDepth = maxDepth === 0 ? 999 : maxDepth

  // Mark current game as being imported to prevent circular imports
  importingSet.add(bggData.id)

  const supabase = createAdminClient()
  const parentsToImport: number[] = []

  // Check if this is an expansion and base game doesn't exist
  if (bggData.expandsGame) {
    const baseGameBggId = bggData.expandsGame.id
    if (!importingSet.has(baseGameBggId)) {
      const exists = await gameExistsByBggId(supabase, baseGameBggId)
      if (!exists) {
        console.log(`[Importer] Will import base game "${bggData.expandsGame.name}" (BGG ${baseGameBggId}) first`)
        parentsToImport.push(baseGameBggId)
      }
    }
  }

  // Check if this reimplements another game and original doesn't exist
  if (bggData.implementsGame) {
    const originalBggId = bggData.implementsGame.id
    if (!importingSet.has(originalBggId)) {
      const exists = await gameExistsByBggId(supabase, originalBggId)
      if (!exists) {
        console.log(`[Importer] Will import original game "${bggData.implementsGame.name}" (BGG ${originalBggId}) first`)
        parentsToImport.push(originalBggId)
      }
    }
  }

  // Import parent games recursively
  for (const parentBggId of parentsToImport) {
    console.log(`[Importer] Recursively importing parent game BGG ${parentBggId}...`)
    await importGameFromBGG(parentBggId, {
      importParents: true,
      maxDepth: effectiveDepth - 1,
      importingSet,
    })
  }
}

/**
 * Check for unimported relations and update the has_unimported_relations flag
 */
async function updateUnimportedRelationsFlag(
  supabase: SupabaseClient<Database>,
  gameId: string,
  bggData: BGGRawGame
): Promise<void> {
  // Collect all BGG IDs of related games
  const relatedBggIds: number[] = []

  // Expansions of this game (if this is a base game)
  if (bggData.expansions && bggData.expansions.length > 0) {
    relatedBggIds.push(...bggData.expansions.map(e => e.id))
  }

  // Reimplementations of this game (if this is the original)
  if (bggData.implementations && bggData.implementations.length > 0) {
    relatedBggIds.push(...bggData.implementations.map(i => i.id))
  }

  if (relatedBggIds.length === 0) {
    // No child relations, flag should be false
    await supabase
      .from('games')
      .update({ has_unimported_relations: false })
      .eq('id', gameId)
    return
  }

  // Check how many of these related games exist in our DB
  const { data: existingGames } = await supabase
    .from('games')
    .select('bgg_id')
    .in('bgg_id', relatedBggIds)

  const existingBggIds = new Set(existingGames?.map(g => g.bgg_id) || [])
  const hasUnimported = relatedBggIds.some(id => !existingBggIds.has(id))

  await supabase
    .from('games')
    .update({ has_unimported_relations: hasUnimported })
    .eq('id', gameId)

  if (hasUnimported) {
    const unimportedCount = relatedBggIds.filter(id => !existingBggIds.has(id)).length
    console.log(`[Importer] Game has ${unimportedCount} unimported related games`)
  }
}

/**
 * Update has_unimported_relations flag for all games related to a newly imported game
 * This should be called after importing a game to update parent games' flags
 */
async function updateParentGameFlags(
  supabase: SupabaseClient<Database>,
  bggData: BGGRawGame
): Promise<void> {
  const parentBggIds: number[] = []

  // If this is an expansion, update the base game's flag
  if (bggData.expandsGame) {
    parentBggIds.push(bggData.expandsGame.id)
  }

  // If this is a reimplementation, update the original game's flag
  if (bggData.implementsGame) {
    parentBggIds.push(bggData.implementsGame.id)
  }

  if (parentBggIds.length === 0) return

  // Find parent games in our DB
  const { data: parentGames } = await supabase
    .from('games')
    .select('id, bgg_id, bgg_raw_data')
    .in('bgg_id', parentBggIds)

  if (!parentGames || parentGames.length === 0) return

  // Update each parent's flag
  for (const parent of parentGames) {
    if (parent.bgg_raw_data) {
      await updateUnimportedRelationsFlag(
        supabase,
        parent.id,
        parent.bgg_raw_data as unknown as BGGRawGame
      )
    }
  }
}

/**
 * Get the complexity tier ID for a given weight value
 */
async function getComplexityTierIdForWeight(weight: number | undefined): Promise<string | null> {
  if (!weight || weight <= 0) return null

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('complexity_tiers')
    .select('id')
    .lte('weight_min', weight)
    .gt('weight_max', weight)
    .single()

  if (error || !data) {
    // Try edge case: weight exactly equals weight_max of expert tier (5.0)
    if (weight >= 5.0) {
      const { data: expertTier } = await supabase
        .from('complexity_tiers')
        .select('id')
        .eq('slug', 'expert')
        .single()
      return expertTier?.id || null
    }
    return null
  }

  return data.id
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
    tagline: null,  // Tagline generated by Vecna, not from BGG
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
    weight: bgg.weight >= 1 && bgg.weight <= 5 ? bgg.weight : null,  // BGG weight must be 1-5
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
 * @param bggId - The BGG ID of the game to import
 * @param options - Import options (importParents, maxDepth, etc.)
 */
export async function importGameFromBGG(
  bggId: number,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const { importParents = true, maxDepth = 3, importingSet = new Set() } = options
  const supabase = createAdminClient()

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

  // Fetch from Puffin cache (with automatic retry for pending games)
  const fetchResult = await fetchWithRetry(bggId)

  if (!fetchResult.game) {
    return {
      success: false,
      bggId,
      error: fetchResult.message || 'Failed to fetch game data. Please try again later.'
    }
  }

  const bggData = fetchResult.game

  // Import parent games first if enabled (base game for expansions, original for reimplementations)
  if (importParents && maxDepth > 0) {
    await importParentGamesFirst(bggData, { importParents, maxDepth, importingSet })
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

  // Get complexity tier based on weight
  const complexityTierId = await getComplexityTierIdForWeight(bggData.weight)
  if (complexityTierId) {
    gameData.complexity_tier_id = complexityTierId
  }

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

  // Link any pending awards that were pre-imported from Wikidata
  const linkedAwards = await linkPendingAwards(newGame.id, bggId)
  if (linkedAwards > 0) {
    console.log(`  [Awards] Linked ${linkedAwards} pending awards`)
  }

  // Link to categories based on BGG categories (alias system + name fallback)
  await linkGameToCategories(newGame.id, bggData.categoryLinks, bggData.categories, bggData.id)

  // Link to themes based on BGG categories (alias system + name fallback)
  await linkGameToThemes(newGame.id, bggData.categoryLinks, bggData.categories)

  // Link to player experiences based on BGG categories and mechanics (alias system + name fallback)
  await linkGameToPlayerExperiences(newGame.id, bggData.categoryLinks, bggData.categories, bggData.mechanics)

  // Link to designers, publishers, artists, and mechanics
  if (bggData.designers.length > 0) {
    await linkGameDesigners(supabase, newGame.id, bggData.designers)
  }
  if (bggData.publishers.length > 0) {
    // Pass Puffin publisher data for enrichment (website, description, etc.)
    await linkGamePublishers(supabase, newGame.id, bggData.publishers, bggData.publisherData)
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

  // Create implementation/reimplementation relations
  // If this game reimplements another, link to original
  if (bggData.implementsGame) {
    await linkImplementationRelation(supabase, newGame.id, bggData.implementsGame.id, bggData.yearPublished)
  }

  // If this is an original game, link any existing reimplementations in our DB
  if (bggData.implementations.length > 0) {
    const implementationBggIds = bggData.implementations.map(i => i.id)
    await linkOriginalGameImplementations(supabase, newGame.id, implementationBggIds, bggData.yearPublished)
  }

  // =====================================================
  // PUFFIN ENRICHMENT: Pre-enriched Wikidata + Wikipedia + Commons
  // =====================================================
  // bggData is already ConsolidatedGameData with enrichment from Puffin
  // (Wikidata, Wikipedia, Commons data is included in the initial fetch)

  if (bggData.enrichment && bggData.enrichment.status !== 'bgg_only') {
    const gameUpdate = mapPuffinEnrichmentToGameUpdate(bggData)
    const relationData = extractRelationData(bggData)

    // Determine Vecna state from enrichment
    const vecnaState = determineVecnaStateFromPuffin(bggData)

    // Apply enrichment update
    // Set is_preview_visible = true when enriched (game has meaningful data to show)
    await supabase.from('games').update({
      ...gameUpdate,
      vecna_state: vecnaState,
      vecna_processed_at: new Date().toISOString(),
      is_preview_visible: true,
    }).eq('id', newGame.id)

    console.log(`  [Puffin] Applied ${bggData.enrichment.status} enrichment (state: ${vecnaState})`)

    // Post-processing: family linking from Wikidata series
    if (relationData.seriesId) {
      console.log(`  [Wikidata] Part of series: ${relationData.seriesName} (${relationData.seriesId})`)
      await linkFamilyFromWikidataSeries(newGame.id, {
        seriesId: relationData.seriesId,
        seriesName: relationData.seriesName,
      })
    }

    // Post-processing: sequel relations from Wikidata
    if (relationData.followsBggId || relationData.followedByBggId) {
      await createWikidataSequelRelations(newGame.id, {
        followsBggId: relationData.followsBggId,
        followedByBggId: relationData.followedByBggId,
      })
    }

    // NOTE: Wikipedia family enrichment disabled during import
    // Existing family data from BGG/Wikidata should be sufficient
    // Can be re-enabled later if needed via enrichFamilyFromWikipedia()

    // Log Commons results (images are available for manual selection in admin)
    if (relationData.commonsImages.length > 0) {
      console.log(`  [Commons] Found ${relationData.commonsImages.length} CC-licensed images available for import`)
    }
  } else {
    // No enrichment from Puffin - set to imported state
    // Puffin will enrich async, can be refreshed later
    await supabase.from('games').update({
      vecna_state: 'imported',
    }).eq('id', newGame.id)

    console.log(`  [Puffin] No enrichment available yet, marked as imported`)
  }

  // Attempt to pull Puffin AI content (non-blocking)
  try {
    const contentResult = await importContentForSingleGame(bggId)
    if (contentResult.updated) {
      console.log(`  [Puffin Content] Applied AI content for ${bggData.name}`)
    }
  } catch (error) {
    console.warn(`  [Puffin Content] Failed (non-blocking):`, error)
  }

  // Update has_unimported_relations flag for this game
  await updateUnimportedRelationsFlag(supabase, newGame.id, bggData)

  // Update parent games' flags (they may now have fewer unimported relations)
  await updateParentGameFlags(supabase, bggData)

  return {
    success: true,
    gameId: newGame.id,
    slug: newGame.slug,
    bggId,
    name: bggData.name
  }
}

/**
 * Link a game to categories based on BGG categories
 * Uses alias system (BGG ID lookup) with fallback to name-based mapping
 */
async function linkGameToCategories(gameId: string, bggCategoryLinks: BGGLink[], bggCategories: string[], bggId?: number): Promise<void> {
  const supabase = createAdminClient()

  // Get our categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug')

  if (!categories) return

  const categoryBySlug = new Map(categories.map(c => [c.slug, c.id]))
  const categoryById = new Map(categories.map(c => [c.id, c.slug]))
  const matchedCategoryIds = new Set<string>()
  const matchedBggCategories = new Set<string>()

  // Step 1: Resolve via alias system (BGG IDs)
  if (bggCategoryLinks.length > 0) {
    const bggIds = bggCategoryLinks.map(link => link.id)
    const aliasMap = await resolveBGGAliases(bggIds, 'category', 'category')

    for (const [bggLinkId, targetId] of aliasMap) {
      if (categoryById.has(targetId)) {
        matchedCategoryIds.add(targetId)
        // Find the original BGG category name for tracking
        const link = bggCategoryLinks.find(l => l.id === bggLinkId)
        if (link) matchedBggCategories.add(link.name)
      }
    }
  }

  // Step 2: Fall back to name-based mapping for unmatched categories
  for (const bggCat of bggCategories) {
    const ourSlug = BGG_CATEGORY_MAP[bggCat]
    if (ourSlug && categoryBySlug.has(ourSlug)) {
      const categoryId = categoryBySlug.get(ourSlug)!
      matchedCategoryIds.add(categoryId)
      matchedBggCategories.add(bggCat)
    }
  }

  // Track unmapped categories
  const unmappedCategories = bggCategories.filter(cat => !matchedBggCategories.has(cat))
  if (unmappedCategories.length > 0 && bggId) {
    await trackUnmappedBGGTags(
      supabase,
      bggId,
      unmappedCategories.map(name => ({ name, type: 'category' as const }))
    )
  }

  // Insert category links
  if (matchedCategoryIds.size > 0) {
    const categoryIdArray = Array.from(matchedCategoryIds)
    const links = categoryIdArray.map((categoryId, index) => ({
      game_id: gameId,
      category_id: categoryId,
      is_primary: index === 0,  // First match is primary
      source: 'bgg',
    }))

    await supabase.from('game_categories').insert(links)
  }
}

/**
 * Link a game to themes based on BGG categories
 * Uses alias system (BGG ID lookup) with fallback to name-based mapping
 */
async function linkGameToThemes(gameId: string, bggCategoryLinks: BGGLink[], bggCategories: string[]): Promise<void> {
  const supabase = createAdminClient()

  // Get all themes
  const { data: themes } = await supabase
    .from('themes')
    .select('id, slug')

  if (!themes) return

  const themeBySlug = new Map(themes.map(t => [t.slug, t.id]))
  const themeById = new Map(themes.map(t => [t.id, t.slug]))
  const matchedThemeIds = new Set<string>()

  // Step 1: Resolve via alias system (BGG IDs)
  if (bggCategoryLinks.length > 0) {
    const bggIds = bggCategoryLinks.map(link => link.id)
    const aliasMap = await resolveBGGAliases(bggIds, 'category', 'theme')

    for (const [, targetId] of aliasMap) {
      if (themeById.has(targetId)) {
        matchedThemeIds.add(targetId)
      }
    }
  }

  // Step 2: Fall back to name-based mapping for unmatched categories
  const themeSlugs = getBGGThemeSlugs(bggCategories)
  for (const slug of themeSlugs) {
    if (themeBySlug.has(slug)) {
      matchedThemeIds.add(themeBySlug.get(slug)!)
    }
  }

  if (matchedThemeIds.size === 0) return

  // Insert theme links
  const themeIdArray = Array.from(matchedThemeIds)
  const links = themeIdArray.map((themeId, index) => ({
    game_id: gameId,
    theme_id: themeId,
    is_primary: index === 0,  // First match is primary
    source: 'bgg',
  }))

  await supabase.from('game_themes').insert(links)
}

/**
 * Link a game to player experiences based on BGG categories and mechanics
 * Uses alias system (BGG ID lookup) with fallback to name-based mapping
 */
async function linkGameToPlayerExperiences(
  gameId: string,
  bggCategoryLinks: BGGLink[],
  bggCategories: string[],
  bggMechanics: string[]
): Promise<void> {
  const supabase = createAdminClient()

  // Get all player experiences
  const { data: experiences } = await supabase
    .from('player_experiences')
    .select('id, slug')

  if (!experiences) return

  const expBySlug = new Map(experiences.map(e => [e.slug, e.id]))
  const expById = new Map(experiences.map(e => [e.id, e.slug]))
  const matchedExpIds = new Set<string>()

  // Step 1: Resolve via alias system (BGG IDs)
  if (bggCategoryLinks.length > 0) {
    const bggIds = bggCategoryLinks.map(link => link.id)
    const aliasMap = await resolveBGGAliases(bggIds, 'category', 'player_experience')

    for (const [, targetId] of aliasMap) {
      if (expById.has(targetId)) {
        matchedExpIds.add(targetId)
      }
    }
  }

  // Step 2: Fall back to name-based mapping for unmatched categories/mechanics
  const experienceSlugs = getBGGExperienceSlugs(bggCategories, bggMechanics)
  for (const slug of experienceSlugs) {
    if (expBySlug.has(slug)) {
      matchedExpIds.add(expBySlug.get(slug)!)
    }
  }

  if (matchedExpIds.size === 0) return

  // Insert experience links
  const expIdArray = Array.from(matchedExpIds)
  const links = expIdArray.map((expId, index) => ({
    game_id: gameId,
    player_experience_id: expId,
    is_primary: index === 0,  // First match is primary
    source: 'bgg',
  }))

  await supabase.from('game_player_experiences').insert(links)
}

/**
 * Process the import queue - import next batch of pending games
 */
export async function importNextBatch(limit: number = 5): Promise<ImportResult[]> {
  const supabase = createAdminClient()

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
  const supabase = createAdminClient()

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

  // Fetch fresh data from Puffin cache (with automatic retry for pending games)
  const fetchResult = await fetchWithRetry(game.bgg_id)

  if (!fetchResult.game) {
    return {
      success: false,
      bggId: game.bgg_id,
      error: fetchResult.message || 'Failed to fetch game data. Please try again later.'
    }
  }

  const bggData = fetchResult.game

  // Update only BGG-sourced fields (not our content, settings, or images)
  // NOTE: Not syncing BGG images - they don't work reliably with Next.js image optimization
  const { error: updateError } = await supabase
    .from('games')
    .update({
      weight: bggData.weight >= 1 && bggData.weight <= 5 ? bggData.weight : null,  // BGG weight must be 1-5
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
  const supabase = createAdminClient()

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
