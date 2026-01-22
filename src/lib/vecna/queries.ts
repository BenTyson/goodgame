/**
 * Vecna Query Utilities
 *
 * Shared functions for fetching game taxonomy and relation data.
 * Consolidates duplicated query code from the admin pages and pipeline routes.
 */

import { SupabaseClient } from '@supabase/supabase-js'

// =====================================================
// Expansion Detection Utilities
// =====================================================

/**
 * Get set of game IDs that are expansions (have expansion_of or standalone_expansion_of relations)
 *
 * @param supabase - Supabase client instance
 * @param gameIds - Array of game IDs to check
 * @returns Set of game IDs that are expansions
 */
export async function getExpansionGameIds(
  supabase: SupabaseClient,
  gameIds: string[]
): Promise<Set<string>> {
  if (gameIds.length === 0) return new Set()

  const { data } = await supabase
    .from('game_relations')
    .select('source_game_id')
    .in('source_game_id', gameIds)
    .in('relation_type', ['expansion_of', 'standalone_expansion_of'])

  return new Set(data?.map(r => r.source_game_id) || [])
}

/**
 * Check if a single game is an expansion and get its base game ID
 *
 * @param supabase - Supabase client instance
 * @param gameId - Game ID to check
 * @returns Object with isExpansion flag, base game ID, and relation type
 */
export async function getExpansionInfo(
  supabase: SupabaseClient,
  gameId: string
): Promise<{ isExpansion: boolean; baseGameId: string | null; relationType: string | null }> {
  const { data } = await supabase
    .from('game_relations')
    .select('relation_type, target_game_id')
    .eq('source_game_id', gameId)
    .in('relation_type', ['expansion_of', 'standalone_expansion_of'])
    .limit(1)
    .maybeSingle()

  return {
    isExpansion: !!data,
    baseGameId: data?.target_game_id ?? null,
    relationType: data?.relation_type ?? null,
  }
}

/**
 * Get all expansion IDs for a base game
 *
 * @param supabase - Supabase client instance
 * @param baseGameId - Base game ID to get expansions for
 * @returns Array of expansion game IDs
 */
export async function getExpansionsOfGame(
  supabase: SupabaseClient,
  baseGameId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('game_relations')
    .select('source_game_id')
    .eq('target_game_id', baseGameId)
    .in('relation_type', ['expansion_of', 'standalone_expansion_of'])

  return data?.map(r => r.source_game_id) || []
}

// =====================================================
// Taxonomy Query Utilities
// =====================================================
import type {
  TaxonomyMaps,
  CategoryRow,
  MechanicRow,
  ThemeRow,
  PlayerExperienceRow,
  GameCategoryJoin,
  GameMechanicJoin,
  GameThemeJoin,
  GamePlayerExperienceJoin,
} from './types'

/**
 * Fetch taxonomy data for a list of games and build Maps for efficient lookup.
 *
 * Runs 4 parallel queries for categories, mechanics, themes, and player experiences,
 * then builds Maps keyed by game_id for O(1) lookup.
 *
 * @param supabase - Supabase client instance
 * @param gameIds - Array of game IDs to fetch taxonomy for
 * @returns TaxonomyMaps with categories, mechanics, themes, and playerExperiences Maps
 */
export async function fetchGameTaxonomy(
  supabase: SupabaseClient,
  gameIds: string[]
): Promise<TaxonomyMaps> {
  if (gameIds.length === 0) {
    return {
      categories: new Map(),
      mechanics: new Map(),
      themes: new Map(),
      playerExperiences: new Map(),
    }
  }

  // Run all 4 taxonomy queries in parallel
  const [categoriesResult, mechanicsResult, themesResult, playerExperiencesResult] = await Promise.all([
    supabase
      .from('game_categories')
      .select('game_id, is_primary, source, categories:category_id(id, name, slug)')
      .in('game_id', gameIds),
    supabase
      .from('game_mechanics')
      .select('game_id, source, mechanics:mechanic_id(id, name, slug)')
      .in('game_id', gameIds),
    supabase
      .from('game_themes')
      .select('game_id, source, themes:theme_id(id, name, slug)')
      .in('game_id', gameIds),
    supabase
      .from('game_player_experiences')
      .select('game_id, is_primary, player_experiences:player_experience_id(id, name, slug)')
      .in('game_id', gameIds),
  ])

  // Cast results to proper types
  const gameCategories = categoriesResult.data as GameCategoryJoin[] | null
  const gameMechanics = mechanicsResult.data as GameMechanicJoin[] | null
  const gameThemes = themesResult.data as GameThemeJoin[] | null
  const gamePlayerExperiences = playerExperiencesResult.data as GamePlayerExperienceJoin[] | null

  // Build categories map
  const categoriesMap = new Map<string, CategoryRow[]>()
  for (const gc of gameCategories || []) {
    const cat = gc.categories as unknown as { id: string; name: string; slug: string } | null
    if (!cat) continue
    if (!categoriesMap.has(gc.game_id)) categoriesMap.set(gc.game_id, [])
    categoriesMap.get(gc.game_id)!.push({
      ...cat,
      is_primary: gc.is_primary ?? false,
      source: gc.source,
    })
  }

  // Build mechanics map
  const mechanicsMap = new Map<string, MechanicRow[]>()
  for (const gm of gameMechanics || []) {
    const mech = gm.mechanics as unknown as { id: string; name: string; slug: string } | null
    if (!mech) continue
    if (!mechanicsMap.has(gm.game_id)) mechanicsMap.set(gm.game_id, [])
    mechanicsMap.get(gm.game_id)!.push({
      ...mech,
      source: gm.source,
    })
  }

  // Build themes map
  const themesMap = new Map<string, ThemeRow[]>()
  for (const gt of gameThemes || []) {
    const theme = gt.themes as unknown as { id: string; name: string; slug: string } | null
    if (!theme) continue
    if (!themesMap.has(gt.game_id)) themesMap.set(gt.game_id, [])
    themesMap.get(gt.game_id)!.push({
      ...theme,
      source: gt.source,
    })
  }

  // Build player experiences map
  const playerExperiencesMap = new Map<string, PlayerExperienceRow[]>()
  for (const gpe of gamePlayerExperiences || []) {
    const pe = gpe.player_experiences as unknown as { id: string; name: string; slug: string } | null
    if (!pe) continue
    if (!playerExperiencesMap.has(gpe.game_id)) playerExperiencesMap.set(gpe.game_id, [])
    playerExperiencesMap.get(gpe.game_id)!.push({
      ...pe,
      is_primary: gpe.is_primary ?? false,
    })
  }

  return {
    categories: categoriesMap,
    mechanics: mechanicsMap,
    themes: themesMap,
    playerExperiences: playerExperiencesMap,
  }
}
