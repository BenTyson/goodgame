import { createClient } from './server'
import { createBrowserClient } from '@supabase/ssr'
import type { Game, Category, Collection, GameImage, AffiliateLink, Database } from '@/types/database'

// Simple client for static generation (no cookies needed)
function createStaticClient() {
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
    console.error('Error fetching games:', error)
    return []
  }

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
    console.error('Error fetching game:', error)
    return null
  }

  return data
}

export async function getFeaturedGames(limit = 6): Promise<Game[]> {
  return getGames({ featured: true, limit })
}

export async function getGameImages(gameId: string): Promise<GameImage[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_images')
    .select('*')
    .eq('game_id', gameId)
    .order('display_order')

  if (error) {
    console.error('Error fetching game images:', error)
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
    console.error('Error fetching affiliate links:', error)
    return []
  }

  return data || []
}

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
    console.error('Error fetching categories:', error)
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
    console.error('Error fetching category:', error)
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
    console.error('Error fetching games by category:', error)
    return []
  }

  // Extract and filter published games
  const games = data
    ?.map(item => item.games)
    .filter((game): game is Game => game !== null && (game as Game).is_published === true)
    .sort((a, b) => a.name.localeCompare(b.name))

  return games || []
}

// ===========================================
// COLLECTIONS
// ===========================================

export async function getCollections(options?: {
  featured?: boolean
  limit?: number
}): Promise<Collection[]> {
  const supabase = await createClient()

  let query = supabase
    .from('collections')
    .select('*')
    .eq('is_published', true)
    .order('display_order')

  if (options?.featured) {
    query = query.eq('is_featured', true)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching collections:', error)
    return []
  }

  return data || []
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) {
    console.error('Error fetching collection:', error)
    return null
  }

  return data
}

export async function getGamesInCollection(collectionSlug: string): Promise<(Game & { note?: string | null })[]> {
  const supabase = await createClient()

  // First get the collection
  const collection = await getCollectionBySlug(collectionSlug)
  if (!collection) return []

  // Get games in this collection via junction table
  const { data, error } = await supabase
    .from('collection_games')
    .select('note, display_order, games(*)')
    .eq('collection_id', collection.id)
    .order('display_order')

  if (error) {
    console.error('Error fetching games in collection:', error)
    return []
  }

  // Extract games with note
  const games = data
    ?.map(item => ({
      ...(item.games as Game),
      note: item.note
    }))
    .filter(game => game.is_published)

  return games || []
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
    console.error('Error searching games:', error)
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
    console.error('Error fetching score sheet fields:', fieldsError)
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
    console.error('Error fetching game count:', error)
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
    console.error('Error fetching game slugs:', error)
    return []
  }

  return data?.map(g => g.slug) || []
}

export async function getAllCategorySlugs(): Promise<string[]> {
  // Use static client for generateStaticParams (no cookies)
  const supabase = createStaticClient()

  const { data, error } = await supabase
    .from('categories')
    .select('slug')

  if (error) {
    console.error('Error fetching category slugs:', error)
    return []
  }

  return data?.map(c => c.slug) || []
}

export async function getAllCollectionSlugs(): Promise<string[]> {
  // Use static client for generateStaticParams (no cookies)
  const supabase = createStaticClient()

  const { data, error } = await supabase
    .from('collections')
    .select('slug')
    .eq('is_published', true)

  if (error) {
    console.error('Error fetching collection slugs:', error)
    return []
  }

  return data?.map(c => c.slug) || []
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

  // Get images
  const { data: images } = await supabase
    .from('game_images')
    .select('*')
    .eq('game_id', game.id)
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

  return {
    ...game,
    images: images || [],
    categories: categories || [],
    affiliate_links: affiliateLinks || []
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
