import { createClient } from './server'
import { createBrowserClient } from '@supabase/ssr'
import type {
  Game,
  Category,
  Collection,
  GameImage,
  AffiliateLink,
  Award,
  AwardCategory,
  GameAward,
  Designer,
  Publisher,
  Artist,
  Mechanic,
  GameFamily,
  GameRelation,
  GameRelationWithTarget,
  GameRelationWithSource,
  GameFamilyWithGames,
  Database
} from '@/types/database'

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
      query = query.gte('max_players', filters.playersMin)
    }
    if (filters.playersMax !== undefined) {
      query = query.lte('min_players', filters.playersMax)
    }
    if (filters.timeMin !== undefined) {
      query = query.gte('max_play_time', filters.timeMin)
    }
    if (filters.timeMax !== undefined && filters.timeMax < 180) {
      query = query.lte('min_play_time', filters.timeMax)
    }
    if (filters.weightMin !== undefined && filters.weightMin > 1) {
      query = query.gte('complexity', filters.weightMin)
    }
    if (filters.weightMax !== undefined && filters.weightMax < 5) {
      query = query.lte('complexity', filters.weightMax)
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
    query = query.gte('max_players', filters.playersMin)
  }
  if (filters.playersMax !== undefined) {
    query = query.lte('min_players', filters.playersMax)
  }
  if (filters.timeMin !== undefined) {
    query = query.gte('max_play_time', filters.timeMin)
  }
  if (filters.timeMax !== undefined && filters.timeMax < 180) {
    query = query.lte('min_play_time', filters.timeMax)
  }
  if (filters.weightMin !== undefined && filters.weightMin > 1) {
    query = query.gte('complexity', filters.weightMin)
  }
  if (filters.weightMax !== undefined && filters.weightMax < 5) {
    query = query.lte('complexity', filters.weightMax)
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

export async function getGameImages(gameId: string): Promise<GameImage[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_images')
    .select('*')
    .eq('game_id', gameId)
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

export async function getAllCollectionSlugs(): Promise<string[]> {
  // Use static client for generateStaticParams (no cookies)
  const supabase = createStaticClient()

  const { data, error } = await supabase
    .from('collections')
    .select('slug')
    .eq('is_published', true)

  if (error) {
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

// ===========================================
// AWARDS
// ===========================================

export async function getAwards(): Promise<Award[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('awards')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  if (error) {
    return []
  }

  return data || []
}

export async function getAwardBySlug(slug: string): Promise<Award | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('awards')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getAwardCategories(awardId: string): Promise<AwardCategory[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('award_categories')
    .select('*')
    .eq('award_id', awardId)
    .order('display_order')

  if (error) {
    return []
  }

  return data || []
}

export async function getAwardWithCategories(slug: string) {
  const award = await getAwardBySlug(slug)
  if (!award) return null

  const categories = await getAwardCategories(award.id)

  return {
    ...award,
    categories
  }
}

export type GameAwardWithDetails = GameAward & {
  award: Award
  category: AwardCategory | null
}

export async function getGameAwards(gameId: string): Promise<GameAwardWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_awards')
    .select(`
      *,
      award:awards(*),
      category:award_categories(*)
    `)
    .eq('game_id', gameId)
    .order('year', { ascending: false })

  if (error) {
    return []
  }

  // Transform nested data
  return (data || []).map(item => ({
    ...item,
    award: item.award as Award,
    category: item.category as AwardCategory | null
  }))
}

export type AwardWinner = {
  game: Game
  category: AwardCategory | null
  year: number
  result: string | null
  notes: string | null
}

export async function getAwardWinners(awardSlug: string, options?: {
  year?: number
  categorySlug?: string
  limit?: number
}): Promise<AwardWinner[]> {
  const supabase = await createClient()

  // First get the award
  const award = await getAwardBySlug(awardSlug)
  if (!award) return []

  let query = supabase
    .from('game_awards')
    .select(`
      year,
      result,
      notes,
      game:games(*),
      category:award_categories(*)
    `)
    .eq('award_id', award.id)
    .order('year', { ascending: false })

  if (options?.year) {
    query = query.eq('year', options.year)
  }

  if (options?.categorySlug) {
    // Get category ID first
    const { data: catData } = await supabase
      .from('award_categories')
      .select('id')
      .eq('award_id', award.id)
      .eq('slug', options.categorySlug)
      .single()

    if (catData) {
      query = query.eq('category_id', catData.id)
    }
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    return []
  }

  // Filter published games and transform
  return (data || [])
    .filter(item => item.game && (item.game as Game).is_published)
    .map(item => ({
      game: item.game as Game,
      category: item.category as AwardCategory | null,
      year: item.year,
      result: item.result,
      notes: item.notes
    }))
}

export async function getAllAwardSlugs(): Promise<string[]> {
  const supabase = createStaticClient()

  const { data, error } = await supabase
    .from('awards')
    .select('slug')
    .eq('is_active', true)

  if (error) {
    return []
  }

  return data?.map(a => a.slug) || []
}

// ===========================================
// DESIGNERS
// ===========================================

export async function getDesigners(): Promise<Designer[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('designers')
    .select('*')
    .order('name')

  if (error) {
    return []
  }

  return data || []
}

export async function getDesignerBySlug(slug: string): Promise<Designer | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('designers')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getGamesByDesigner(designerSlug: string): Promise<Game[]> {
  const supabase = await createClient()

  const designer = await getDesignerBySlug(designerSlug)
  if (!designer) return []

  const { data, error } = await supabase
    .from('game_designers')
    .select('game_id, games(*)')
    .eq('designer_id', designer.id)
    .order('display_order')

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.games as Game)
    .filter(game => game && game.is_published)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getGameDesigners(gameId: string): Promise<Designer[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_designers')
    .select('designer_id, display_order, designers(*)')
    .eq('game_id', gameId)
    .order('display_order')

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.designers as Designer)
    .filter(d => d !== null)
}

export async function getAllDesignerSlugs(): Promise<string[]> {
  const supabase = createStaticClient()

  const { data, error } = await supabase
    .from('designers')
    .select('slug')

  if (error) {
    return []
  }

  return data?.map(d => d.slug) || []
}

// ===========================================
// PUBLISHERS
// ===========================================

export async function getPublishers(): Promise<Publisher[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('publishers')
    .select('*')
    .order('name')

  if (error) {
    return []
  }

  return data || []
}

export async function getPublisherBySlug(slug: string): Promise<Publisher | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('publishers')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getGamesByPublisher(publisherSlug: string): Promise<Game[]> {
  const supabase = await createClient()

  const publisher = await getPublisherBySlug(publisherSlug)
  if (!publisher) return []

  const { data, error } = await supabase
    .from('game_publishers')
    .select('game_id, games(*)')
    .eq('publisher_id', publisher.id)
    .order('display_order')

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.games as Game)
    .filter(game => game && game.is_published)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getGamePublishers(gameId: string): Promise<Publisher[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_publishers')
    .select('publisher_id, display_order, publishers(*)')
    .eq('game_id', gameId)
    .order('display_order')

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.publishers as Publisher)
    .filter(p => p !== null)
}

export async function getAllPublisherSlugs(): Promise<string[]> {
  const supabase = createStaticClient()

  const { data, error } = await supabase
    .from('publishers')
    .select('slug')

  if (error) {
    return []
  }

  return data?.map(p => p.slug) || []
}

// ===========================================
// ARTISTS
// ===========================================

export async function getArtists(): Promise<Artist[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .order('name')

  if (error) {
    return []
  }

  return data || []
}

export async function getArtistBySlug(slug: string): Promise<Artist | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getGamesByArtist(artistSlug: string): Promise<Game[]> {
  const supabase = await createClient()

  const artist = await getArtistBySlug(artistSlug)
  if (!artist) return []

  const { data, error } = await supabase
    .from('game_artists')
    .select('game_id, games(*)')
    .eq('artist_id', artist.id)
    .order('display_order')

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.games as Game)
    .filter(game => game && game.is_published)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getGameArtists(gameId: string): Promise<Artist[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_artists')
    .select('artist_id, display_order, artists(*)')
    .eq('game_id', gameId)
    .order('display_order')

  if (error) {
    return []
  }

  return (data || [])
    .map(item => item.artists as Artist)
    .filter(a => a !== null)
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
// GAME FAMILIES
// ===========================================

export async function getGameFamilies(): Promise<GameFamily[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_families')
    .select('*')
    .order('name')

  if (error) {
    return []
  }

  return data || []
}

export async function getGameFamilyBySlug(slug: string): Promise<GameFamily | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_families')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getGamesInFamily(familyId: string): Promise<Game[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_published', true)
    .order('year_published', { ascending: true, nullsFirst: false })

  if (error) {
    return []
  }

  return data || []
}

export async function getGameFamilyWithGames(slug: string): Promise<GameFamilyWithGames | null> {
  const supabase = await createClient()

  // First get the family
  const { data: family, error: familyError } = await supabase
    .from('game_families')
    .select('*')
    .eq('slug', slug)
    .single()

  if (familyError || !family) {
    return null
  }

  // Then get the games in this family
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .eq('family_id', family.id)
    .eq('is_published', true)
    .order('year_published', { ascending: true, nullsFirst: false })

  if (gamesError) {
    return { ...family, games: [], game_count: 0 }
  }

  return {
    ...family,
    games: games || [],
    game_count: games?.length || 0
  }
}

export async function getGameFamily(gameId: string): Promise<GameFamily | null> {
  const supabase = await createClient()

  // Get the game's family_id first
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('family_id')
    .eq('id', gameId)
    .single()

  if (gameError || !game || !game.family_id) {
    return null
  }

  // Then get the family
  const { data: family, error: familyError } = await supabase
    .from('game_families')
    .select('*')
    .eq('id', game.family_id)
    .single()

  if (familyError) {
    return null
  }

  return family
}

export async function getAllFamilySlugs(): Promise<string[]> {
  const supabase = createStaticClient()

  const { data, error } = await supabase
    .from('game_families')
    .select('slug')

  if (error) {
    return []
  }

  return data?.map(f => f.slug) || []
}

export async function getFamiliesWithGameCounts(): Promise<(GameFamily & { game_count: number })[]> {
  const supabase = await createClient()

  // Get all families
  const { data: families, error: familiesError } = await supabase
    .from('game_families')
    .select('*')
    .order('name')

  if (familiesError || !families) {
    return []
  }

  // Get game counts for each family
  const familiesWithCounts = await Promise.all(
    families.map(async (family) => {
      const { count } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', family.id)
        .eq('is_published', true)

      return {
        ...family,
        game_count: count || 0
      }
    })
  )

  // Only return families with at least one published game
  return familiesWithCounts.filter(f => f.game_count > 0)
}

// ===========================================
// GAME RELATIONS
// ===========================================

export async function getGameRelations(gameId: string): Promise<GameRelationWithTarget[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_relations')
    .select(`
      *,
      target_game:games!game_relations_target_game_id_fkey(*)
    `)
    .eq('source_game_id', gameId)
    .order('display_order')

  if (error) {
    return []
  }

  // Filter out relations where target game is not published
  return (data || [])
    .filter(r => r.target_game && (r.target_game as Game).is_published)
    .map(r => ({
      ...r,
      target_game: r.target_game as Game
    }))
}

export async function getInverseGameRelations(gameId: string): Promise<GameRelationWithSource[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_relations')
    .select(`
      *,
      source_game:games!game_relations_source_game_id_fkey(*)
    `)
    .eq('target_game_id', gameId)
    .order('display_order')

  if (error) {
    return []
  }

  // Filter out relations where source game is not published
  return (data || [])
    .filter(r => r.source_game && (r.source_game as Game).is_published)
    .map(r => ({
      ...r,
      source_game: r.source_game as Game
    }))
}

export async function getAllGameRelations(gameId: string): Promise<{
  direct: GameRelationWithTarget[]
  inverse: GameRelationWithSource[]
}> {
  const [direct, inverse] = await Promise.all([
    getGameRelations(gameId),
    getInverseGameRelations(gameId)
  ])

  return { direct, inverse }
}
