import { createClient } from './server'
import { createStaticClient } from './game-queries'
import type { Category, Game, Mechanic, Theme, PlayerExperience, ComplexityTier, BGGTagAlias } from '@/types/database'

// ===========================================
// CATEGORIES
// ===========================================

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order')

  if (error) {
    return []
  }

  return data || []
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getGamesByCategory(categorySlug: string): Promise<Game[]> {
  const supabase = await createClient()

  // First get the category
  const category = await getCategoryBySlug(categorySlug)
  if (!category) return []

  // Get games in this category via junction table
  const { data, error } = await supabase
    .from('game_categories')
    .select('game_id, games(*)')
    .eq('category_id', category.id)

  if (error) {
    return []
  }

  // Extract and filter published games
  const games = data
    ?.map(item => item.games)
    .filter((game): game is Game => game !== null && (game as Game).is_published === true)
    .sort((a, b) => a.name.localeCompare(b.name))

  return games || []
}

export async function getAllCategorySlugs(): Promise<string[]> {
  // Use static client for generateStaticParams (no cookies)
  const supabase = createStaticClient()

  const { data, error } = await supabase
    .from('categories')
    .select('slug')

  if (error) {
    return []
  }

  return data?.map(c => c.slug) || []
}

export async function getCategoriesWithGameCounts(): Promise<(Category & { game_count: number })[]> {
  const supabase = await createClient()

  // Get all categories ordered by display_order
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('display_order')

  if (catError || !categories) {
    return []
  }

  // Get counts from junction table (only published games)
  const { data: counts, error: countError } = await supabase
    .from('game_categories')
    .select(`
      category_id,
      games!inner(is_published)
    `)
    .eq('games.is_published', true)

  if (countError) {
    // Return categories with 0 counts if count query fails
    return categories.map(cat => ({ ...cat, game_count: 0 }))
  }

  // Aggregate counts per category
  const countMap = new Map<string, number>()
  counts?.forEach(row => {
    const current = countMap.get(row.category_id) || 0
    countMap.set(row.category_id, current + 1)
  })

  return categories.map(cat => ({
    ...cat,
    game_count: countMap.get(cat.id) || 0
  }))
}

// ===========================================
// MECHANICS
// ===========================================

export async function getMechanics(): Promise<Mechanic[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mechanics')
    .select('*')
    .order('name')

  if (error) {
    return []
  }

  return data || []
}

export async function getMechanicBySlug(slug: string): Promise<Mechanic | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('mechanics')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getGamesByMechanic(mechanicSlug: string): Promise<Game[]> {
  const supabase = await createClient()

  const mechanic = await getMechanicBySlug(mechanicSlug)
  if (!mechanic) return []

  const { data, error } = await supabase
    .from('game_mechanics')
    .select('game_id, games(*)')
    .eq('mechanic_id', mechanic.id)

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.games as Game)
    .filter(game => game && game.is_published)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getGameMechanics(gameId: string): Promise<Mechanic[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_mechanics')
    .select('mechanic_id, mechanics(*)')
    .eq('game_id', gameId)

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.mechanics as Mechanic)
    .filter(m => m !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

// ===========================================
// THEMES
// ===========================================

export async function getThemes(): Promise<Theme[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .order('display_order')

  if (error) {
    return []
  }

  return data || []
}

export async function getThemeBySlug(slug: string): Promise<Theme | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getGamesByTheme(themeSlug: string): Promise<Game[]> {
  const supabase = await createClient()

  const theme = await getThemeBySlug(themeSlug)
  if (!theme) return []

  const { data, error } = await supabase
    .from('game_themes')
    .select('game_id, games(*)')
    .eq('theme_id', theme.id)

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.games as Game)
    .filter(game => game && game.is_published)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getGameThemes(gameId: string): Promise<Theme[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_themes')
    .select('theme_id, themes(*)')
    .eq('game_id', gameId)

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.themes as Theme)
    .filter(t => t !== null)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
}

// ===========================================
// PLAYER EXPERIENCES
// ===========================================

export async function getPlayerExperiences(): Promise<PlayerExperience[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('player_experiences')
    .select('*')
    .order('display_order')

  if (error) {
    return []
  }

  return data || []
}

export async function getPlayerExperienceBySlug(slug: string): Promise<PlayerExperience | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('player_experiences')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getGamesByPlayerExperience(experienceSlug: string): Promise<Game[]> {
  const supabase = await createClient()

  const experience = await getPlayerExperienceBySlug(experienceSlug)
  if (!experience) return []

  const { data, error } = await supabase
    .from('game_player_experiences')
    .select('game_id, games(*)')
    .eq('player_experience_id', experience.id)

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.games as Game)
    .filter(game => game && game.is_published)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getGamePlayerExperiences(gameId: string): Promise<PlayerExperience[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_player_experiences')
    .select('player_experience_id, player_experiences(*)')
    .eq('game_id', gameId)

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.player_experiences as PlayerExperience)
    .filter(pe => pe !== null)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
}

// ===========================================
// COMPLEXITY TIERS
// ===========================================

export async function getComplexityTiers(): Promise<ComplexityTier[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('complexity_tiers')
    .select('*')
    .order('display_order')

  if (error) {
    return []
  }

  return data || []
}

export async function getComplexityTierBySlug(slug: string): Promise<ComplexityTier | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('complexity_tiers')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getComplexityTierByWeight(weight: number): Promise<ComplexityTier | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('complexity_tiers')
    .select('*')
    .lte('weight_min', weight)
    .gt('weight_max', weight)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getGamesByComplexityTier(tierSlug: string): Promise<Game[]> {
  const supabase = await createClient()

  const tier = await getComplexityTierBySlug(tierSlug)
  if (!tier) return []

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('complexity_tier_id', tier.id)
    .eq('is_published', true)
    .order('name')

  if (error) {
    return []
  }

  return data || []
}

export async function getGameComplexityTier(gameId: string): Promise<ComplexityTier | null> {
  const supabase = await createClient()

  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('complexity_tier_id')
    .eq('id', gameId)
    .single()

  if (gameError || !game?.complexity_tier_id) {
    return null
  }

  const { data, error } = await supabase
    .from('complexity_tiers')
    .select('*')
    .eq('id', game.complexity_tier_id)
    .single()

  if (error) {
    return null
  }

  return data
}

// ===========================================
// BGG TAG ALIASES
// ===========================================

/**
 * Get all BGG aliases for a specific target (e.g., all aliases pointing to a theme)
 */
export async function getBGGAliasesForTarget(targetType: string, targetId: string): Promise<BGGTagAlias[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bgg_tag_aliases')
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('bgg_name')

  if (error) {
    return []
  }

  return (data || []) as BGGTagAlias[]
}

/**
 * Get a BGG alias by BGG ID and type
 */
export async function getBGGAliasByBGGId(
  bggId: number,
  bggType: string,
  targetType: string
): Promise<BGGTagAlias | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bgg_tag_aliases')
    .select('*')
    .eq('bgg_id', bggId)
    .eq('bgg_type', bggType)
    .eq('target_type', targetType)
    .single()

  if (error) {
    return null
  }

  return data as BGGTagAlias
}

/**
 * Get all target IDs for a set of BGG IDs
 * Used during import to resolve BGG categories to our internal tags
 */
export async function resolveBGGAliases(
  bggIds: number[],
  bggType: string,
  targetType: string
): Promise<Map<number, string>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bgg_tag_aliases')
    .select('bgg_id, target_id')
    .in('bgg_id', bggIds)
    .eq('bgg_type', bggType)
    .eq('target_type', targetType)

  if (error || !data) {
    return new Map()
  }

  return new Map(data.map(alias => [alias.bgg_id, alias.target_id]))
}

/**
 * Create a new BGG alias
 */
export async function createBGGAlias(alias: {
  bgg_id: number
  bgg_name: string
  bgg_type: string
  target_type: string
  target_id: string
}): Promise<BGGTagAlias | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('bgg_tag_aliases')
    .insert(alias)
    .select()
    .single()

  if (error) {
    console.error('Failed to create BGG alias:', error)
    return null
  }

  return data as BGGTagAlias
}

/**
 * Delete a BGG alias
 */
export async function deleteBGGAlias(id: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('bgg_tag_aliases')
    .delete()
    .eq('id', id)

  return !error
}
