import { createClient } from './server'
import { createBrowserClient } from '@supabase/ssr'
import type {
  Game,
  Category,
  GameImage,
  AffiliateLink,
  Designer,
  Publisher,
  Mechanic,
  Database
} from '@/types/database'

// Simple client for static generation (no cookies needed)
export function createStaticClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ===========================================
// GAMES
// ===========================================

export async function getGames(options?: {
  limit?: number
  featured?: boolean
  categorySlug?: string
}): Promise<Game[]> {
  const supabase = await createClient()

  let query = supabase
    .from('games')
    .select('*')
    .eq('is_published', true)
    .order('name')

  if (options?.featured) {
    query = query.eq('is_featured', true)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    return []
  }

  return data || []
}

export interface GameFilters {
  categories?: string[]
  playersMin?: number
  playersMax?: number
  timeMin?: number
  timeMax?: number
  weightMin?: number
  weightMax?: number
}

export async function getFilteredGames(filters: GameFilters): Promise<Game[]> {
  const supabase = await createClient()

  // If filtering by categories, we need to join with game_categories
  if (filters.categories && filters.categories.length > 0) {
    // First get category IDs
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .in('slug', filters.categories)

    if (!categoryData || categoryData.length === 0) {
      return []
    }

    const categoryIds = categoryData.map(c => c.id)

    // Get game IDs that belong to these categories
    const { data: gameCategories } = await supabase
      .from('game_categories')
      .select('game_id')
      .in('category_id', categoryIds)

    if (!gameCategories || gameCategories.length === 0) {
      return []
    }

    const gameIds = [...new Set(gameCategories.map(gc => gc.game_id))]

    // Now get the games with additional filters
    let query = supabase
      .from('games')
      .select('*')
      .eq('is_published', true)
      .in('id', gameIds)
      .order('name')

    // Apply numeric filters
    if (filters.playersMin !== undefined) {
      query = query.gte('player_count_max', filters.playersMin)
    }
    if (filters.playersMax !== undefined) {
      query = query.lte('player_count_min', filters.playersMax)
    }
    if (filters.timeMin !== undefined) {
      query = query.gte('play_time_max', filters.timeMin)
    }
    if (filters.timeMax !== undefined && filters.timeMax < 180) {
      query = query.lte('play_time_min', filters.timeMax)
    }
    if (filters.weightMin !== undefined && filters.weightMin > 1) {
      query = query.gte('weight', filters.weightMin)
    }
    if (filters.weightMax !== undefined && filters.weightMax < 5) {
      query = query.lte('weight', filters.weightMax)
    }

    const { data } = await query
    return data || []
  }

  // No category filter - just apply numeric filters
  let query = supabase
    .from('games')
    .select('*')
    .eq('is_published', true)
    .order('name')

  // Apply numeric filters
  if (filters.playersMin !== undefined) {
    query = query.gte('player_count_max', filters.playersMin)
  }
  if (filters.playersMax !== undefined) {
    query = query.lte('player_count_min', filters.playersMax)
  }
  if (filters.timeMin !== undefined) {
    query = query.gte('play_time_max', filters.timeMin)
  }
  if (filters.timeMax !== undefined && filters.timeMax < 180) {
    query = query.lte('play_time_min', filters.timeMax)
  }
  if (filters.weightMin !== undefined && filters.weightMin > 1) {
    query = query.gte('weight', filters.weightMin)
  }
  if (filters.weightMax !== undefined && filters.weightMax < 5) {
    query = query.lte('weight', filters.weightMax)
  }

  const { data } = await query
  return data || []
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getFeaturedGames(limit = 6): Promise<Game[]> {
  return getGames({ featured: true, limit })
}

export async function getFeaturedGame(): Promise<(Game & {
  categories?: Category[]
  publishers_list?: Publisher[]
}) | null> {
  const supabase = await createClient()

  // Get first featured game with an image
  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('is_published', true)
    .eq('is_featured', true)
    .not('hero_image_url', 'is', null)
    .limit(1)
    .single()

  if (error || !game) {
    // Fallback: get any featured game
    const { data: fallback } = await supabase
      .from('games')
      .select('*')
      .eq('is_published', true)
      .eq('is_featured', true)
      .limit(1)
      .single()

    if (!fallback) return null

    // Get categories for fallback
    const { data: categories } = await supabase
      .from('game_categories')
      .select('category:categories(*)')
      .eq('game_id', fallback.id)

    // Get publishers
    const { data: publishers } = await supabase
      .from('game_publishers')
      .select('publisher:publishers(*)')
      .eq('game_id', fallback.id)

    return {
      ...fallback,
      categories: categories?.map(c => c.category).filter(Boolean) as Category[] || [],
      publishers_list: publishers?.map(p => p.publisher).filter(Boolean) as Publisher[] || []
    }
  }

  // Get categories
  const { data: categories } = await supabase
    .from('game_categories')
    .select('category:categories(*)')
    .eq('game_id', game.id)

  // Get publishers
  const { data: publishers } = await supabase
    .from('game_publishers')
    .select('publisher:publishers(*)')
    .eq('game_id', game.id)

  return {
    ...game,
    categories: categories?.map(c => c.category).filter(Boolean) as Category[] || [],
    publishers_list: publishers?.map(p => p.publisher).filter(Boolean) as Publisher[] || []
  }
}

export async function getGameImages(gameId: string): Promise<GameImage[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_images')
    .select('*')
    .eq('game_id', gameId)
    .order('is_primary', { ascending: false })
    .order('display_order')

  if (error) {
    return []
  }

  return data || []
}

export async function getAffiliateLinks(gameId: string): Promise<AffiliateLink[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('affiliate_links')
    .select('*')
    .eq('game_id', gameId)
    .order('display_order')

  if (error) {
    return []
  }

  return data || []
}

// ===========================================
// SEARCH
// ===========================================

export async function searchGames(query: string): Promise<Game[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('search_games', {
    search_query: query
  })

  if (error) {
    return []
  }

  return data || []
}

// ===========================================
// SCORE SHEETS
// ===========================================

export async function getScoreSheetConfig(gameId: string) {
  const supabase = await createClient()

  const { data: config, error: configError } = await supabase
    .from('score_sheet_configs')
    .select('*')
    .eq('game_id', gameId)
    .single()

  if (configError || !config) {
    return null
  }

  const { data: fields, error: fieldsError } = await supabase
    .from('score_sheet_fields')
    .select('*')
    .eq('config_id', config.id)
    .order('display_order')

  if (fieldsError) {
    return { ...config, fields: [] }
  }

  return { ...config, fields: fields || [] }
}

// ===========================================
// STATS / COUNTS
// ===========================================

export async function getGameCount(): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)

  if (error) {
    return 0
  }

  return count || 0
}

export async function getAllGameSlugs(): Promise<string[]> {
  // Use static client for generateStaticParams (no cookies)
  const supabase = createStaticClient()

  const { data, error } = await supabase
    .from('games')
    .select('slug')
    .eq('is_published', true)

  if (error) {
    return []
  }

  return data?.map(g => g.slug) || []
}

// ===========================================
// GAME WITH FULL DETAILS
// ===========================================

export async function getGameWithDetails(slug: string) {
  const supabase = await createClient()

  // Get game
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (gameError || !game) {
    return null
  }

  // Get images (primary first, then by display order)
  const { data: images } = await supabase
    .from('game_images')
    .select('*')
    .eq('game_id', game.id)
    .order('is_primary', { ascending: false })
    .order('display_order')

  // Get categories via junction table
  const { data: categoryLinks } = await supabase
    .from('game_categories')
    .select('category_id, is_primary, categories(*)')
    .eq('game_id', game.id)

  const categories = categoryLinks
    ?.map(link => ({
      ...(link.categories as Category),
      is_primary: link.is_primary ?? false
    }))
    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))

  // Get affiliate links
  const { data: affiliateLinks } = await supabase
    .from('affiliate_links')
    .select('*')
    .eq('game_id', game.id)
    .order('display_order')

  // Get designers via junction table
  const { data: designerLinks } = await supabase
    .from('game_designers')
    .select('designer_id, is_primary, display_order, designers(*)')
    .eq('game_id', game.id)
    .order('display_order')

  const designers_list = (designerLinks || [])
    .map(link => link.designers as Designer)
    .filter(d => d !== null)

  // Get publishers via junction table
  const { data: publisherLinks } = await supabase
    .from('game_publishers')
    .select('publisher_id, is_primary, display_order, publishers(*)')
    .eq('game_id', game.id)
    .order('display_order')

  const publishers_list = (publisherLinks || [])
    .map(link => link.publishers as Publisher)
    .filter(p => p !== null)

  // Get mechanics via junction table
  const { data: mechanicLinks } = await supabase
    .from('game_mechanics')
    .select('mechanic_id, mechanics(*)')
    .eq('game_id', game.id)

  const mechanics = (mechanicLinks || [])
    .map(link => link.mechanics as Mechanic)
    .filter(m => m !== null)
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    ...game,
    images: images || [],
    categories: categories || [],
    affiliate_links: affiliateLinks || [],
    designers_list,
    publishers_list,
    mechanics
  }
}

// ===========================================
// RELATED GAMES
// ===========================================

export async function getRelatedGames(gameSlug: string, limit = 4): Promise<Game[]> {
  const supabase = await createClient()

  // Get the current game and its categories
  const { data: game } = await supabase
    .from('games')
    .select('id')
    .eq('slug', gameSlug)
    .single()

  if (!game) return []

  // Get category IDs for this game
  const { data: categoryLinks } = await supabase
    .from('game_categories')
    .select('category_id')
    .eq('game_id', game.id)

  if (!categoryLinks || categoryLinks.length === 0) {
    // Fallback: just get other featured games
    const { data: featuredGames } = await supabase
      .from('games')
      .select('*')
      .eq('is_published', true)
      .eq('is_featured', true)
      .neq('slug', gameSlug)
      .limit(limit)

    return featuredGames || []
  }

  const categoryIds = categoryLinks.map(l => l.category_id)

  // Get games in the same categories
  const { data: relatedLinks } = await supabase
    .from('game_categories')
    .select('game_id, games(*)')
    .in('category_id', categoryIds)
    .neq('game_id', game.id)

  if (!relatedLinks) return []

  // Deduplicate and filter published games
  const seenIds = new Set<string>()
  const relatedGames: Game[] = []

  for (const link of relatedLinks) {
    const g = link.games as Game | null
    if (g && g.is_published && !seenIds.has(g.id)) {
      seenIds.add(g.id)
      relatedGames.push(g)
      if (relatedGames.length >= limit) break
    }
  }

  return relatedGames
}
