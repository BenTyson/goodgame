import { createClient } from './server'
import { createAdminClient } from './admin'
import { createBrowserClient } from '@supabase/ssr'
import type {
  Game,
  Category,
  GameImage,
  GameDocument,
  AffiliateLink,
  AffiliateLinkWithRetailer,
  Retailer,
  Designer,
  Publisher,
  Artist,
  Mechanic,
  Theme,
  PlayerExperience,
  ComplexityTier,
  TaxonomySuggestion,
  Database,
  ActivityWithDetails,
} from '@/types/database'
import type { ParsedTextStructured } from '@/lib/rulebook/types'
import type { GameVideo } from '@/components/admin/VideoManager'

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
    .or('is_promo.is.null,is_promo.eq.false')
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
  query?: string
  categories?: string[]
  mechanics?: string[]
  themes?: string[]
  experiences?: string[]
  playersMin?: number
  playersMax?: number
  timeMin?: number
  timeMax?: number
  weightMin?: number
  weightMax?: number
}

export async function getFilteredGames(filters: GameFilters): Promise<Game[]> {
  const supabase = await createClient()

  // Track game IDs that match junction table filters (categories, mechanics)
  // We intersect these to find games matching ALL filters
  let filteredGameIds: Set<string> | null = null

  // Filter by categories
  if (filters.categories && filters.categories.length > 0) {
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .in('slug', filters.categories)

    if (!categoryData || categoryData.length === 0) {
      return []
    }

    const categoryIds = categoryData.map(c => c.id)

    const { data: gameCategories } = await supabase
      .from('game_categories')
      .select('game_id')
      .in('category_id', categoryIds)

    if (!gameCategories || gameCategories.length === 0) {
      return []
    }

    const categoryGameIds = new Set(gameCategories.map(gc => gc.game_id))
    filteredGameIds = categoryGameIds
  }

  // Filter by mechanics
  if (filters.mechanics && filters.mechanics.length > 0) {
    const { data: mechanicData } = await supabase
      .from('mechanics')
      .select('id')
      .in('slug', filters.mechanics)

    if (!mechanicData || mechanicData.length === 0) {
      return []
    }

    const mechanicIds = mechanicData.map(m => m.id)

    const { data: gameMechanics } = await supabase
      .from('game_mechanics')
      .select('game_id')
      .in('mechanic_id', mechanicIds)

    if (!gameMechanics || gameMechanics.length === 0) {
      return []
    }

    const mechanicGameIds = new Set(gameMechanics.map(gm => gm.game_id))

    // Intersect with existing filtered IDs (if any)
    if (filteredGameIds !== null) {
      filteredGameIds = new Set([...filteredGameIds].filter(id => mechanicGameIds.has(id)))
      if (filteredGameIds.size === 0) {
        return []
      }
    } else {
      filteredGameIds = mechanicGameIds
    }
  }

  // Filter by themes
  if (filters.themes && filters.themes.length > 0) {
    const { data: themeData } = await supabase
      .from('themes')
      .select('id')
      .in('slug', filters.themes)

    if (!themeData || themeData.length === 0) {
      return []
    }

    const themeIds = themeData.map(t => t.id)

    const { data: gameThemes } = await supabase
      .from('game_themes')
      .select('game_id')
      .in('theme_id', themeIds)

    if (!gameThemes || gameThemes.length === 0) {
      return []
    }

    const themeGameIds = new Set(gameThemes.map(gt => gt.game_id))

    // Intersect with existing filtered IDs (if any)
    if (filteredGameIds !== null) {
      filteredGameIds = new Set([...filteredGameIds].filter(id => themeGameIds.has(id)))
      if (filteredGameIds.size === 0) {
        return []
      }
    } else {
      filteredGameIds = themeGameIds
    }
  }

  // Filter by player experiences
  if (filters.experiences && filters.experiences.length > 0) {
    const { data: experienceData } = await supabase
      .from('player_experiences')
      .select('id')
      .in('slug', filters.experiences)

    if (!experienceData || experienceData.length === 0) {
      return []
    }

    const experienceIds = experienceData.map(e => e.id)

    const { data: gameExperiences } = await supabase
      .from('game_player_experiences')
      .select('game_id')
      .in('player_experience_id', experienceIds)

    if (!gameExperiences || gameExperiences.length === 0) {
      return []
    }

    const experienceGameIds = new Set(gameExperiences.map(ge => ge.game_id))

    // Intersect with existing filtered IDs (if any)
    if (filteredGameIds !== null) {
      filteredGameIds = new Set([...filteredGameIds].filter(id => experienceGameIds.has(id)))
      if (filteredGameIds.size === 0) {
        return []
      }
    } else {
      filteredGameIds = experienceGameIds
    }
  }

  // Build the main query
  let query = supabase
    .from('games')
    .select('*')
    .eq('is_published', true)
    .or('is_promo.is.null,is_promo.eq.false')
    .order('name')

  // Apply search query
  if (filters.query && filters.query.trim().length >= 2) {
    query = query.ilike('name', `%${filters.query.trim()}%`)
  }

  // Apply junction table filter results
  if (filteredGameIds !== null) {
    query = query.in('id', [...filteredGameIds])
  }

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

export interface TrendingGame extends Game {
  recentVibeCount: number
  averageVibe: number | null
}

/**
 * Get trending games based on recent rating activity
 * Returns games with the most ratings in the last 7 days
 */
export async function getTrendingGames(limit = 6): Promise<TrendingGame[]> {
  const supabase = await createClient()

  // Get ratings from the last 7 days, grouped by game
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentRatings, error: ratingsError } = await supabase
    .from('user_games')
    .select('game_id, rating')
    .not('rating', 'is', null)
    .gte('updated_at', sevenDaysAgo.toISOString())

  if (ratingsError || !recentRatings || recentRatings.length === 0) {
    // Fallback to featured games if no recent activity
    const featured = await getFeaturedGames(limit)
    return featured.map(g => ({ ...g, recentVibeCount: 0, averageVibe: null }))
  }

  // Count ratings per game and calculate average
  const gameStats = new Map<string, { count: number; sum: number }>()
  for (const r of recentRatings) {
    const stats = gameStats.get(r.game_id) || { count: 0, sum: 0 }
    stats.count++
    stats.sum += r.rating!
    gameStats.set(r.game_id, stats)
  }

  // Sort by count and take top games
  const sortedGameIds = [...gameStats.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([gameId]) => gameId)

  if (sortedGameIds.length === 0) {
    const featured = await getFeaturedGames(limit)
    return featured.map(g => ({ ...g, recentVibeCount: 0, averageVibe: null }))
  }

  // Fetch the games (exclude promos)
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .in('id', sortedGameIds)
    .eq('is_published', true)
    .or('is_promo.is.null,is_promo.eq.false')

  if (gamesError || !games) {
    return []
  }

  // Combine game data with stats and maintain sort order
  const gameMap = new Map(games.map(g => [g.id, g]))
  const result: TrendingGame[] = []

  for (const gameId of sortedGameIds) {
    const game = gameMap.get(gameId)
    if (game) {
      const stats = gameStats.get(gameId)!
      result.push({
        ...game,
        recentVibeCount: stats.count,
        averageVibe: Math.round((stats.sum / stats.count) * 10) / 10,
      })
    }
  }

  return result
}

export async function getFeaturedGame(): Promise<(Game & {
  categories?: Category[]
  publishers_list?: Publisher[]
}) | null> {
  const supabase = await createClient()

  // Get first featured game with an image (exclude promos)
  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('is_published', true)
    .eq('is_featured', true)
    .or('is_promo.is.null,is_promo.eq.false')
    .not('hero_image_url', 'is', null)
    .limit(1)
    .single()

  if (error || !game) {
    // Fallback: get any featured game (exclude promos)
    const { data: fallback } = await supabase
      .from('games')
      .select('*')
      .eq('is_published', true)
      .eq('is_featured', true)
      .or('is_promo.is.null,is_promo.eq.false')
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

export async function getAffiliateLinks(gameId: string): Promise<AffiliateLinkWithRetailer[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('affiliate_links')
    .select(`
      *,
      retailer:retailers(*)
    `)
    .eq('game_id', gameId)
    .order('display_order')

  if (error) {
    return []
  }

  return (data || []) as AffiliateLinkWithRetailer[]
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
// COMMUNITY ACTIVITY (Server-side)
// ===========================================

/**
 * Get recent public community activity (for homepage)
 * Server-side query - shows activities from all public users
 */
export async function getRecentCommunityActivity(
  limit = 10
): Promise<ActivityWithDetails[]> {
  const supabase = await createClient()

  // Get recent activities from public profiles
  const { data, error } = await supabase
    .from('user_activities')
    .select(`
      *,
      user:user_profiles!user_id(id, username, display_name, avatar_url, custom_avatar_url, profile_visibility),
      target_user:user_profiles!target_user_id(id, username, display_name, avatar_url, custom_avatar_url),
      game:games!game_id(id, name, slug, box_image_url, thumbnail_url, is_published)
    `)
    .order('created_at', { ascending: false })
    .limit(limit * 2) // Fetch extra to filter out private profiles

  if (error) {
    console.error('Error fetching community activity:', error)
    return []
  }

  // Filter to only public profiles and published games
  const publicActivities = (data || []).filter((item) => {
    const user = item.user as { profile_visibility?: string } | null
    const game = item.game as { is_published?: boolean } | null

    // User must be public
    if (user?.profile_visibility !== 'public') return false

    // If activity has a game, it must be published
    if (game && !game.is_published) return false

    return true
  })

  return publicActivities.slice(0, limit) as ActivityWithDetails[]
}

// ===========================================
// STATS / COUNTS
// ===========================================

export interface CommunityStats {
  totalGames: number
  totalRatings: number
  totalUsers: number
}

/**
 * Get community statistics for homepage display
 */
export async function getCommunityStats(): Promise<CommunityStats> {
  const supabase = await createClient()

  const [gamesResult, ratingsResult, usersResult] = await Promise.all([
    // Published games count (exclude promos)
    supabase
      .from('games')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .or('is_promo.is.null,is_promo.eq.false'),
    // Ratings count (user_games with rating)
    supabase
      .from('user_games')
      .select('*', { count: 'exact', head: true })
      .not('rating', 'is', null),
    // Public users count
    supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('profile_visibility', 'public'),
  ])

  return {
    totalGames: gamesResult.count || 0,
    totalRatings: ratingsResult.count || 0,
    totalUsers: usersResult.count || 0,
  }
}

export async function getGameCount(): Promise<number> {
  const supabase = await createClient()

  // Exclude promos from count
  const { count, error } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .or('is_promo.is.null,is_promo.eq.false')

  if (error) {
    return 0
  }

  return count || 0
}

export async function getAllGameSlugs(): Promise<string[]> {
  // Use static client for generateStaticParams (no cookies)
  const supabase = createStaticClient()

  // Exclude promos from static generation
  const { data, error } = await supabase
    .from('games')
    .select('slug')
    .eq('is_published', true)
    .or('is_promo.is.null,is_promo.eq.false')

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

  // Get game first (need game.id for other queries)
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (gameError || !game) {
    return null
  }

  // Run all junction table queries in parallel
  const [
    { data: images },
    { data: categoryLinks },
    { data: affiliateLinks },
    { data: designerLinks },
    { data: publisherLinks },
    { data: mechanicLinks },
    { data: themeLinks },
    { data: experienceLinks },
    { data: artistLinks },
    { data: featuredVideo },
    { data: gameplayVideos },
    { data: reviewVideos },
    complexityTierResult,
  ] = await Promise.all([
    // Images
    supabase
      .from('game_images')
      .select('*')
      .eq('game_id', game.id)
      .order('is_primary', { ascending: false })
      .order('display_order'),
    // Categories
    supabase
      .from('game_categories')
      .select('category_id, is_primary, categories(*)')
      .eq('game_id', game.id),
    // Affiliate links
    supabase
      .from('affiliate_links')
      .select('*, retailer:retailers(*)')
      .eq('game_id', game.id)
      .order('display_order'),
    // Designers
    supabase
      .from('game_designers')
      .select('designer_id, is_primary, display_order, designers(*)')
      .eq('game_id', game.id)
      .order('display_order'),
    // Publishers
    supabase
      .from('game_publishers')
      .select('publisher_id, is_primary, display_order, publishers(*)')
      .eq('game_id', game.id)
      .order('display_order'),
    // Mechanics
    supabase
      .from('game_mechanics')
      .select('mechanic_id, mechanics(*)')
      .eq('game_id', game.id),
    // Themes
    supabase
      .from('game_themes')
      .select('theme_id, is_primary, themes(*)')
      .eq('game_id', game.id),
    // Player experiences
    supabase
      .from('game_player_experiences')
      .select('player_experience_id, is_primary, player_experiences(*)')
      .eq('game_id', game.id),
    // Artists
    supabase
      .from('game_artists')
      .select('artist_id, display_order, artists(*)')
      .eq('game_id', game.id)
      .order('display_order'),
    // Featured video
    supabase
      .from('game_videos')
      .select('*')
      .eq('game_id', game.id)
      .eq('is_featured', true)
      .single(),
    // Gameplay videos
    supabase
      .from('game_videos')
      .select('*')
      .eq('game_id', game.id)
      .eq('video_type', 'gameplay')
      .order('display_order'),
    // Review videos
    supabase
      .from('game_videos')
      .select('*')
      .eq('game_id', game.id)
      .eq('video_type', 'review')
      .order('display_order'),
    // Complexity tier (conditional)
    game.complexity_tier_id
      ? supabase
          .from('complexity_tiers')
          .select('*')
          .eq('id', game.complexity_tier_id)
          .single()
      : Promise.resolve({ data: null }),
  ])

  // Process categories
  const categories = categoryLinks
    ?.map(link => ({
      ...(link.categories as Category),
      is_primary: link.is_primary ?? false
    }))
    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))

  // Process designers
  const designers_list = (designerLinks || [])
    .map(link => link.designers as Designer)
    .filter(d => d !== null)

  // Process publishers
  const publishers_list = (publisherLinks || [])
    .map(link => link.publishers as Publisher)
    .filter(p => p !== null)

  // Process mechanics
  const mechanics = (mechanicLinks || [])
    .map(link => link.mechanics as Mechanic)
    .filter(m => m !== null)
    .sort((a, b) => a.name.localeCompare(b.name))

  // Process themes
  const themes = (themeLinks || [])
    .map(link => ({
      ...(link.themes as Theme),
      is_primary: link.is_primary ?? false
    }))
    .filter(t => t.id !== undefined)
    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))

  // Process player experiences
  const player_experiences = (experienceLinks || [])
    .map(link => ({
      ...(link.player_experiences as PlayerExperience),
      is_primary: link.is_primary ?? false
    }))
    .filter(e => e.id !== undefined)
    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))

  // Process artists
  const artists_list = (artistLinks || [])
    .map(link => link.artists as Artist)
    .filter(a => a !== null)

  return {
    ...game,
    images: images || [],
    categories: categories || [],
    affiliate_links: (affiliateLinks || []) as AffiliateLinkWithRetailer[],
    designers_list,
    publishers_list,
    artists_list,
    mechanics,
    themes,
    player_experiences,
    complexity_tier: complexityTierResult?.data ?? null,
    featured_video: featuredVideo || null,
    gameplay_videos: gameplayVideos || [],
    review_videos: reviewVideos || []
  }
}

/**
 * Get game with full details - admin version (bypasses is_published filter)
 * Use only for admin preview of unpublished games
 */
export async function getGameWithDetailsForAdmin(slug: string) {
  const supabase = createAdminClient()

  // Get game WITHOUT is_published filter
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('slug', slug)
    .single()

  if (gameError || !game) {
    return null
  }

  // Run all junction table queries in parallel (same as getGameWithDetails)
  const [
    { data: images },
    { data: categoryLinks },
    { data: affiliateLinks },
    { data: designerLinks },
    { data: publisherLinks },
    { data: mechanicLinks },
    { data: themeLinks },
    { data: experienceLinks },
    { data: artistLinks },
    { data: featuredVideo },
    { data: gameplayVideos },
    { data: reviewVideos },
    complexityTierResult,
  ] = await Promise.all([
    supabase
      .from('game_images')
      .select('*')
      .eq('game_id', game.id)
      .order('is_primary', { ascending: false })
      .order('display_order'),
    supabase
      .from('game_categories')
      .select('category_id, is_primary, categories(*)')
      .eq('game_id', game.id),
    supabase
      .from('affiliate_links')
      .select('*, retailer:retailers(*)')
      .eq('game_id', game.id)
      .order('display_order'),
    supabase
      .from('game_designers')
      .select('designer_id, is_primary, display_order, designers(*)')
      .eq('game_id', game.id)
      .order('display_order'),
    supabase
      .from('game_publishers')
      .select('publisher_id, is_primary, display_order, publishers(*)')
      .eq('game_id', game.id)
      .order('display_order'),
    supabase
      .from('game_mechanics')
      .select('mechanic_id, mechanics(*)')
      .eq('game_id', game.id),
    supabase
      .from('game_themes')
      .select('theme_id, is_primary, themes(*)')
      .eq('game_id', game.id),
    supabase
      .from('game_player_experiences')
      .select('player_experience_id, is_primary, player_experiences(*)')
      .eq('game_id', game.id),
    supabase
      .from('game_artists')
      .select('artist_id, display_order, artists(*)')
      .eq('game_id', game.id)
      .order('display_order'),
    supabase
      .from('game_videos')
      .select('*')
      .eq('game_id', game.id)
      .eq('is_featured', true)
      .single(),
    supabase
      .from('game_videos')
      .select('*')
      .eq('game_id', game.id)
      .eq('video_type', 'gameplay')
      .order('display_order'),
    supabase
      .from('game_videos')
      .select('*')
      .eq('game_id', game.id)
      .eq('video_type', 'review')
      .order('display_order'),
    game.complexity_tier_id
      ? supabase
          .from('complexity_tiers')
          .select('*')
          .eq('id', game.complexity_tier_id)
          .single()
      : Promise.resolve({ data: null }),
  ])

  // Process categories
  const categories = categoryLinks
    ?.map(link => ({
      ...(link.categories as Category),
      is_primary: link.is_primary ?? false
    }))
    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))

  // Process designers
  const designers_list = (designerLinks || [])
    .map(link => link.designers as Designer)
    .filter(d => d !== null)

  // Process publishers
  const publishers_list = (publisherLinks || [])
    .map(link => link.publishers as Publisher)
    .filter(p => p !== null)

  // Process mechanics
  const mechanics = (mechanicLinks || [])
    .map(link => link.mechanics as Mechanic)
    .filter(m => m !== null)
    .sort((a, b) => a.name.localeCompare(b.name))

  // Process themes
  const themes = (themeLinks || [])
    .map(link => ({
      ...(link.themes as Theme),
      is_primary: link.is_primary ?? false
    }))
    .filter(t => t.id !== undefined)
    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))

  // Process player experiences
  const player_experiences = (experienceLinks || [])
    .map(link => ({
      ...(link.player_experiences as PlayerExperience),
      is_primary: link.is_primary ?? false
    }))
    .filter(e => e.id !== undefined)
    .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))

  // Process artists
  const artists_list = (artistLinks || [])
    .map(link => link.artists as Artist)
    .filter(a => a !== null)

  return {
    ...game,
    images: images || [],
    categories: categories || [],
    affiliate_links: (affiliateLinks || []) as AffiliateLinkWithRetailer[],
    designers_list,
    publishers_list,
    artists_list,
    mechanics,
    themes,
    player_experiences,
    complexity_tier: complexityTierResult?.data ?? null,
    featured_video: featuredVideo || null,
    gameplay_videos: gameplayVideos || [],
    review_videos: reviewVideos || []
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
    // Fallback: just get other featured games (exclude promos)
    const { data: featuredGames } = await supabase
      .from('games')
      .select('*')
      .eq('is_published', true)
      .eq('is_featured', true)
      .or('is_promo.is.null,is_promo.eq.false')
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

  // Deduplicate and filter published games (exclude promos)
  const seenIds = new Set<string>()
  const relatedGames: Game[] = []

  for (const link of relatedLinks) {
    const g = link.games as Game | null
    if (g && g.is_published && !g.is_promo && !seenIds.has(g.id)) {
      seenIds.add(g.id)
      relatedGames.push(g)
      if (relatedGames.length >= limit) break
    }
  }

  return relatedGames
}

// ===========================================
// GAME DOCUMENTS
// ===========================================

export async function getGameDocuments(gameId: string): Promise<GameDocument[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('game_documents')
    .select('*')
    .eq('game_id', gameId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching game documents:', error)
    return []
  }

  return data || []
}

// ===========================================
// ADMIN: ADJACENT GAMES FOR NAVIGATION
// ===========================================

export interface AdjacentGames {
  previous: { id: string; name: string } | null
  next: { id: string; name: string } | null
}

/**
 * Get previous and next games alphabetically by name (for admin navigation)
 */
export async function getAdjacentGames(gameId: string): Promise<AdjacentGames> {
  const supabase = createAdminClient()

  // Get current game's name
  const { data: currentGame } = await supabase
    .from('games')
    .select('name')
    .eq('id', gameId)
    .single()

  if (!currentGame) {
    return { previous: null, next: null }
  }

  // Get previous game (name < current, ordered descending to get closest)
  const { data: prevData } = await supabase
    .from('games')
    .select('id, name')
    .lt('name', currentGame.name)
    .order('name', { ascending: false })
    .limit(1)

  // Get next game (name > current, ordered ascending to get closest)
  const { data: nextData } = await supabase
    .from('games')
    .select('id, name')
    .gt('name', currentGame.name)
    .order('name', { ascending: true })
    .limit(1)

  return {
    previous: prevData?.[0] || null,
    next: nextData?.[0] || null,
  }
}

// ===========================================
// ADMIN: GAME EDITOR CONSOLIDATED DATA
// ===========================================

/** Preloaded taxonomy data for GameEditor */
export interface TaxonomyData {
  categories: Category[]
  mechanics: Mechanic[]
  themes: Theme[]
  playerExperiences: PlayerExperience[]
  currentCategories: { category_id: string; is_primary: boolean | null }[]
  currentMechanics: { mechanic_id: string }[]
  currentThemes: { theme_id: string; is_primary: boolean | null }[]
  currentExperiences: { player_experience_id: string; is_primary: boolean | null }[]
  suggestions: TaxonomySuggestion[]
}

/** Preloaded documents data for GameEditor */
export interface DocumentsData {
  gameDocuments: GameDocument[]
  parsedText: {
    text: string | null
    structured: ParsedTextStructured | null
    wordCount: number | null
    pageCount: number | null
    parsedAt: string | null
    characterCount: number | null
  } | null
}

/** Preloaded purchase data for GameEditor */
export interface PurchaseData {
  links: AffiliateLinkWithRetailer[]
  retailers: Retailer[]
}

/** Linked entity for editor (designer, publisher, artist) */
export interface LinkedEntity {
  id: string
  name: string
  slug: string
  is_primary?: boolean
}

/** Game with media for editor */
export interface GameWithMedia extends Game {
  images: GameImage[]
  videos: GameVideo[]
  // Linked entities from junction tables (for editing)
  linked_designers: LinkedEntity[]
  linked_publishers: LinkedEntity[]
  linked_artists: LinkedEntity[]
}

/** Full game editor data bundle */
export interface GameEditorData {
  game: GameWithMedia
  adjacentGames: AdjacentGames
  taxonomy: TaxonomyData
  documents: DocumentsData
  purchase: PurchaseData
}

/**
 * Get all data needed for the game editor in a single parallel fetch.
 * This consolidates what was previously 5+ separate API calls into one server-side query.
 */
export async function getGameEditorData(gameId: string): Promise<GameEditorData | null> {
  const supabase = createAdminClient()

  // First, get the game to verify it exists and get its name for adjacent games
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single()

  if (gameError || !game) {
    return null
  }

  // Cast to include latest_parse_log_id which may not be in generated types
  const gameData = game as Game & { latest_parse_log_id?: string }

  // Run ALL queries in parallel for maximum performance
  const [
    // Game media
    imagesResult,
    videosResult,
    // Linked entities (designers, publishers, artists)
    designerLinksResult,
    publisherLinksResult,
    artistLinksResult,
    // Adjacent games
    prevGameResult,
    nextGameResult,
    // Taxonomy: reference data
    categoriesResult,
    mechanicsResult,
    themesResult,
    experiencesResult,
    // Taxonomy: current assignments
    currentCategoriesResult,
    currentMechanicsResult,
    currentThemesResult,
    currentExperiencesResult,
    // Taxonomy: suggestions
    suggestionsResult,
    // Documents
    gameDocumentsResult,
    parseLogResult,
    // Purchase
    purchaseLinksResult,
    retailersResult,
  ] = await Promise.all([
    // Game media
    supabase
      .from('game_images')
      .select('*')
      .eq('game_id', gameId)
      .order('display_order'),
    supabase
      .from('game_videos')
      .select('*')
      .eq('game_id', gameId)
      .order('display_order'),
    // Linked entities (designers, publishers, artists)
    supabase
      .from('game_designers')
      .select('is_primary, designer:designers(id, name, slug)')
      .eq('game_id', gameId)
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true }),
    supabase
      .from('game_publishers')
      .select('is_primary, publisher:publishers(id, name, slug)')
      .eq('game_id', gameId)
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true }),
    supabase
      .from('game_artists')
      .select('artist:artists(id, name, slug)')
      .eq('game_id', gameId)
      .order('display_order', { ascending: true }),
    // Adjacent games
    supabase
      .from('games')
      .select('id, name')
      .lt('name', game.name)
      .order('name', { ascending: false })
      .limit(1),
    supabase
      .from('games')
      .select('id, name')
      .gt('name', game.name)
      .order('name', { ascending: true })
      .limit(1),
    // Taxonomy: reference data
    supabase.from('categories').select('*').order('display_order'),
    supabase.from('mechanics').select('*').order('name'),
    supabase.from('themes').select('*').order('display_order'),
    supabase.from('player_experiences').select('*').order('display_order'),
    // Taxonomy: current assignments
    supabase.from('game_categories').select('category_id, is_primary').eq('game_id', gameId),
    supabase.from('game_mechanics').select('mechanic_id').eq('game_id', gameId),
    supabase.from('game_themes').select('theme_id, is_primary').eq('game_id', gameId),
    supabase.from('game_player_experiences').select('player_experience_id, is_primary').eq('game_id', gameId),
    // Taxonomy: suggestions
    supabase
      .from('taxonomy_suggestions')
      .select('*')
      .eq('game_id', gameId)
      .eq('status', 'pending')
      .order('confidence', { ascending: false }),
    // Documents
    supabase
      .from('game_documents')
      .select('*')
      .eq('game_id', gameId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false }),
    // Parsed text: try latest_parse_log_id first, then fallback in processing
    gameData.latest_parse_log_id
      ? supabase
          .from('rulebook_parse_log')
          .select('parsed_text, parsed_text_structured, word_count, page_count, created_at')
          .eq('id', gameData.latest_parse_log_id)
          .single()
      : supabase
          .from('rulebook_parse_log')
          .select('parsed_text, parsed_text_structured, word_count, page_count, created_at')
          .eq('game_id', gameId)
          .in('status', ['success', 'partial'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
    // Purchase
    supabase
      .from('affiliate_links')
      .select('*, retailer:retailers(*)')
      .eq('game_id', gameId)
      .order('display_order', { ascending: true }),
    supabase
      .from('retailers')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
  ])

  // Process linked entities (designers, publishers, artists)
  const designers: LinkedEntity[] = (designerLinksResult.data || [])
    .map(d => {
      const designer = d.designer as { id: string; name: string; slug: string } | null
      if (!designer) return null
      const entity: LinkedEntity = { id: designer.id, name: designer.name, slug: designer.slug, is_primary: d.is_primary ?? false }
      return entity
    })
    .filter((d): d is LinkedEntity => d !== null)

  const publishers: LinkedEntity[] = (publisherLinksResult.data || [])
    .map(p => {
      const publisher = p.publisher as { id: string; name: string; slug: string } | null
      if (!publisher) return null
      const entity: LinkedEntity = { id: publisher.id, name: publisher.name, slug: publisher.slug, is_primary: p.is_primary ?? false }
      return entity
    })
    .filter((p): p is LinkedEntity => p !== null)

  const artists: LinkedEntity[] = (artistLinksResult.data || [])
    .map(a => {
      const artist = a.artist as { id: string; name: string; slug: string } | null
      if (!artist) return null
      const entity: LinkedEntity = { id: artist.id, name: artist.name, slug: artist.slug }
      return entity
    })
    .filter((a): a is LinkedEntity => a !== null)

  // Process videos with type assertion
  const typedVideos: GameVideo[] = (videosResult.data || []).map(v => ({
    ...v,
    display_order: v.display_order ?? 0,
    is_featured: v.is_featured ?? false,
    created_at: v.created_at ?? new Date().toISOString(),
    updated_at: v.updated_at ?? new Date().toISOString(),
  })) as GameVideo[]

  // Process parsed text
  let parsedTextData: DocumentsData['parsedText'] = null
  const parseLog = parseLogResult.data
  if (parseLog?.parsed_text) {
    parsedTextData = {
      text: parseLog.parsed_text,
      structured: parseLog.parsed_text_structured as unknown as ParsedTextStructured | null,
      wordCount: parseLog.word_count || null,
      pageCount: parseLog.page_count || null,
      parsedAt: parseLog.created_at || null,
      characterCount: parseLog.parsed_text.length,
    }
  }

  return {
    game: {
      ...game,
      images: imagesResult.data || [],
      videos: typedVideos,
      linked_designers: designers,
      linked_publishers: publishers,
      linked_artists: artists,
    },
    adjacentGames: {
      previous: prevGameResult.data?.[0] || null,
      next: nextGameResult.data?.[0] || null,
    },
    taxonomy: {
      categories: categoriesResult.data || [],
      mechanics: mechanicsResult.data || [],
      themes: themesResult.data || [],
      playerExperiences: experiencesResult.data || [],
      currentCategories: currentCategoriesResult.data || [],
      currentMechanics: currentMechanicsResult.data || [],
      currentThemes: currentThemesResult.data || [],
      currentExperiences: currentExperiencesResult.data || [],
      suggestions: suggestionsResult.data || [],
    },
    documents: {
      gameDocuments: gameDocumentsResult.data || [],
      parsedText: parsedTextData,
    },
    purchase: {
      links: (purchaseLinksResult.data || []) as AffiliateLinkWithRetailer[],
      retailers: retailersResult.data || [],
    },
  }
}
