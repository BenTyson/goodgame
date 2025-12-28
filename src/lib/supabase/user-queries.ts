/**
 * User Shelf Queries
 * Client-side queries for authenticated user shelf operations
 */

import { createClient } from './client'
import type {
  UserGame,
  UserGameInsert,
  UserGameUpdate,
  UserGameWithGame,
  ShelfStatus,
  UserProfile,
  UserProfileUpdate,
  UserFollowWithFollower,
  UserFollowWithFollowing,
  FollowStats,
} from '@/types/database'

// =====================================================
// USER SHELF QUERIES
// =====================================================

export async function getUserShelf(
  userId: string,
  options?: {
    status?: ShelfStatus
    sortBy?: 'name' | 'rating' | 'added' | 'status'
    sortOrder?: 'asc' | 'desc'
  }
): Promise<UserGameWithGame[]> {
  const supabase = createClient()

  let query = supabase
    .from('user_games')
    .select(`
      *,
      game:games(*)
    `)
    .eq('user_id', userId)

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  // Apply sorting
  const sortBy = options?.sortBy || 'added'
  const ascending = options?.sortOrder !== 'desc'

  switch (sortBy) {
    case 'name':
      // Sort by game name requires different approach - sort client-side
      query = query.order('created_at', { ascending: false })
      break
    case 'rating':
      query = query.order('rating', { ascending, nullsFirst: false })
      break
    case 'status':
      query = query.order('status', { ascending })
      break
    case 'added':
    default:
      query = query.order('created_at', { ascending })
  }

  const { data, error } = await query

  if (error) throw error

  // If sorting by name, do it client-side
  if (sortBy === 'name' && data) {
    return data.sort((a, b) => {
      const nameA = a.game?.name || ''
      const nameB = b.game?.name || ''
      return ascending
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA)
    }) as UserGameWithGame[]
  }

  return (data || []) as UserGameWithGame[]
}

export async function getUserGameStatus(
  userId: string,
  gameId: string
): Promise<UserGame | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_games')
    .select('*')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function addToShelf(data: UserGameInsert): Promise<UserGame> {
  const supabase = createClient()

  // Check if this is an update or new add
  const { data: existing } = await supabase
    .from('user_games')
    .select('status')
    .eq('user_id', data.user_id)
    .eq('game_id', data.game_id)
    .maybeSingle()

  const { data: result, error } = await supabase
    .from('user_games')
    .upsert(data, { onConflict: 'user_id,game_id' })
    .select()
    .single()

  if (error) throw error

  // Create activity (fire and forget)
  import('./activity-queries').then(({ createShelfActivity }) => {
    if (existing && existing.status !== data.status) {
      createShelfActivity(data.user_id, data.game_id, data.status!, true, existing.status as ShelfStatus)
        .catch(console.error)
    } else if (!existing) {
      createShelfActivity(data.user_id, data.game_id, data.status!)
        .catch(console.error)
    }
  })

  return result
}

export async function updateShelfItem(
  id: string,
  data: UserGameUpdate
): Promise<UserGame> {
  const supabase = createClient()

  // Get current item to track rating changes
  const { data: current } = await supabase
    .from('user_games')
    .select('user_id, game_id, rating')
    .eq('id', id)
    .single()

  const { data: result, error } = await supabase
    .from('user_games')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Create rating activity if rating changed (and is a new non-null rating)
  if (data.rating !== undefined && current && data.rating !== current.rating && data.rating !== null) {
    import('./activity-queries').then(({ createRatingActivity }) => {
      createRatingActivity(current.user_id, current.game_id, data.rating!)
        .catch(console.error)
    })
  }

  return result
}

export async function removeFromShelf(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_games')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getShelfStats(userId: string): Promise<{
  total: number
  owned: number
  want_to_buy: number
  want_to_play: number
  wishlist: number
  previously_owned: number
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_games')
    .select('status')
    .eq('user_id', userId)

  if (error) throw error

  const stats = {
    total: data?.length || 0,
    owned: data?.filter(g => g.status === 'owned').length || 0,
    want_to_buy: data?.filter(g => g.status === 'want_to_buy').length || 0,
    want_to_play: data?.filter(g => g.status === 'want_to_play').length || 0,
    wishlist: data?.filter(g => g.status === 'wishlist').length || 0,
    previously_owned: data?.filter(g => g.status === 'previously_owned').length || 0,
  }

  return stats
}

// =====================================================
// USER PROFILE QUERIES
// =====================================================

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function updateUserProfile(
  userId: string,
  data: UserProfileUpdate
): Promise<UserProfile> {
  const supabase = createClient()

  const { data: result, error } = await supabase
    .from('user_profiles')
    .update(data)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return result
}

// =====================================================
// PUBLIC PROFILE QUERIES
// =====================================================

/**
 * Check if a username is available
 * Returns true if available, false if taken
 */
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle()

  if (error) throw error
  return data === null
}

/**
 * Get a user profile by username (for public profile pages)
 * Returns null if not found or profile is private
 */
export async function getUserByUsername(username: string): Promise<UserProfile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

/**
 * Get a user's public shelf (for public profile pages)
 * Only returns data if both profile and shelf are public
 */
export async function getPublicShelf(userId: string): Promise<UserGameWithGame[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_games')
    .select(`
      *,
      game:games(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as UserGameWithGame[]
}

/**
 * Get public shelf stats for a user
 */
export async function getPublicShelfStats(userId: string): Promise<{
  total: number
  owned: number
  want_to_buy: number
  want_to_play: number
  wishlist: number
  previously_owned: number
} | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_games')
    .select('status')
    .eq('user_id', userId)

  if (error) throw error
  if (!data || data.length === 0) return null

  return {
    total: data.length,
    owned: data.filter(g => g.status === 'owned').length,
    want_to_buy: data.filter(g => g.status === 'want_to_buy').length,
    want_to_play: data.filter(g => g.status === 'want_to_play').length,
    wishlist: data.filter(g => g.status === 'wishlist').length,
    previously_owned: data.filter(g => g.status === 'previously_owned').length,
  }
}

// =====================================================
// USER TOP GAMES (RANKINGS)
// =====================================================

export interface TopGameWithDetails {
  id: string
  position: number
  game: {
    id: string
    name: string
    slug: string
    box_image_url: string | null
    thumbnail_url: string | null
  }
}

/**
 * Get a user's top 10 games with game details
 */
export async function getUserTopGames(userId: string): Promise<TopGameWithDetails[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_top_games')
    .select(`
      id,
      position,
      game:games(id, name, slug, box_image_url, thumbnail_url)
    `)
    .eq('user_id', userId)
    .order('position', { ascending: true })

  if (error) throw error
  return (data || []) as TopGameWithDetails[]
}

/**
 * Save user's top games (replaces all existing rankings)
 * @param userId - The user's ID
 * @param gameIds - Array of game IDs in order (index 0 = position 1)
 */
export async function saveUserTopGames(userId: string, gameIds: string[]): Promise<void> {
  const supabase = createClient()

  // Get current rankings to detect changes
  const { data: current } = await supabase
    .from('user_top_games')
    .select('game_id')
    .eq('user_id', userId)

  const currentIds = new Set(current?.map(g => g.game_id) || [])
  const newIds = new Set(gameIds)

  const added = gameIds.filter(id => !currentIds.has(id))
  const removed = [...currentIds].filter(id => !newIds.has(id))
  const reordered = added.length === 0 && removed.length === 0 && gameIds.length > 0

  // Delete all existing rankings for this user
  const { error: deleteError } = await supabase
    .from('user_top_games')
    .delete()
    .eq('user_id', userId)

  if (deleteError) throw deleteError

  // Insert new rankings
  if (gameIds.length > 0) {
    const rankings = gameIds.map((gameId, index) => ({
      user_id: userId,
      game_id: gameId,
      position: index + 1,
    }))

    const { error: insertError } = await supabase
      .from('user_top_games')
      .insert(rankings)

    if (insertError) throw insertError
  }

  // Create activity if there were changes
  if (added.length > 0 || removed.length > 0 || reordered) {
    import('./activity-queries').then(({ createTopGamesActivity }) => {
      createTopGamesActivity(userId, { added, removed, reordered })
        .catch(console.error)
    })
  }
}

/**
 * Search games for the top games picker
 */
export async function searchGamesForPicker(query: string, limit = 10): Promise<{
  id: string
  name: string
  slug: string
  box_image_url: string | null
  thumbnail_url: string | null
  year_published: number | null
}[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('games')
    .select('id, name, slug, box_image_url, thumbnail_url, year_published')
    .eq('is_published', true)
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(limit)

  if (error) throw error
  return data || []
}

// =====================================================
// USER FOLLOWS (SOCIAL)
// =====================================================

/**
 * Follow another user
 */
export async function followUser(followerId: string, followingId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_follows')
    .insert({ follower_id: followerId, following_id: followingId })

  if (error) throw error

  // Create activity (fire and forget - don't block on activity creation)
  import('./activity-queries').then(({ createFollowActivity }) => {
    createFollowActivity(followerId, followingId).catch(console.error)
  })
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  if (error) throw error
}

/**
 * Check if current user is following another user
 */
export async function checkIsFollowing(followerId: string, followingId: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle()

  if (error) throw error
  return data !== null
}

/**
 * Get followers of a user with profile data
 */
export async function getUserFollowers(
  userId: string,
  limit = 50,
  offset = 0
): Promise<UserFollowWithFollower[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_follows')
    .select(`
      *,
      follower:user_profiles!follower_id(id, username, display_name, avatar_url, custom_avatar_url)
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return (data || []) as UserFollowWithFollower[]
}

/**
 * Get users that a user is following with profile data
 */
export async function getUserFollowing(
  userId: string,
  limit = 50,
  offset = 0
): Promise<UserFollowWithFollowing[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_follows')
    .select(`
      *,
      following:user_profiles!following_id(id, username, display_name, avatar_url, custom_avatar_url)
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return (data || []) as UserFollowWithFollowing[]
}

/**
 * Get follow stats for a user (counts)
 */
export async function getFollowStats(userId: string): Promise<FollowStats> {
  const supabase = createClient()

  // Use parallel queries for efficiency
  const [followersResult, followingResult] = await Promise.all([
    supabase
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', userId),
    supabase
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', userId),
  ])

  if (followersResult.error) throw followersResult.error
  if (followingResult.error) throw followingResult.error

  return {
    followerCount: followersResult.count || 0,
    followingCount: followingResult.count || 0,
  }
}

// =====================================================
// GAME REVIEWS
// =====================================================

export interface ReviewWithUser {
  id: string
  user_id: string
  game_id: string
  rating: number | null
  review: string
  review_updated_at: string
  user: {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
    custom_avatar_url: string | null
  }
}

export interface ReviewsResponse {
  reviews: ReviewWithUser[]
  hasMore: boolean
  nextCursor?: string
}

const REVIEWS_PAGE_SIZE = 10

/**
 * Get reviews for a game with user profiles (paginated)
 */
export async function getGameReviews(
  gameId: string,
  cursor?: string,
  limit = REVIEWS_PAGE_SIZE
): Promise<ReviewsResponse> {
  const supabase = createClient()

  let query = supabase
    .from('user_games')
    .select(`
      id,
      user_id,
      game_id,
      rating,
      review,
      review_updated_at,
      user:user_profiles!user_id(id, username, display_name, avatar_url, custom_avatar_url)
    `)
    .eq('game_id', gameId)
    .not('review', 'is', null)
    .order('review_updated_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    query = query.lt('review_updated_at', cursor)
  }

  const { data, error } = await query

  if (error) throw error

  const hasMore = data && data.length > limit
  const reviews = (data?.slice(0, limit) || []) as ReviewWithUser[]
  const lastDate = hasMore && reviews.length > 0
    ? reviews[reviews.length - 1].review_updated_at
    : null
  const nextCursor = lastDate ?? undefined

  return {
    reviews,
    hasMore,
    nextCursor,
  }
}

/**
 * Get aggregate rating stats for a game
 */
export async function getGameAggregateRating(gameId: string): Promise<{
  average: number | null
  count: number
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_games')
    .select('rating')
    .eq('game_id', gameId)
    .not('rating', 'is', null)

  if (error) throw error

  if (!data || data.length === 0) {
    return { average: null, count: 0 }
  }

  const ratings = data.map(d => d.rating as number)
  const sum = ratings.reduce((acc, r) => acc + r, 0)
  const average = sum / ratings.length

  return {
    average: Math.round(average * 10) / 10, // Round to 1 decimal
    count: ratings.length,
  }
}

/**
 * Update a review for a shelf item
 */
export async function updateReview(
  userGameId: string,
  review: string | null
): Promise<UserGame> {
  const supabase = createClient()

  // Get current item to track review changes
  const { data: current } = await supabase
    .from('user_games')
    .select('user_id, game_id, review')
    .eq('id', userGameId)
    .single()

  const updateData: UserGameUpdate = {
    review,
    review_updated_at: review ? new Date().toISOString() : null,
  }

  const { data: result, error } = await supabase
    .from('user_games')
    .update(updateData)
    .eq('id', userGameId)
    .select()
    .single()

  if (error) throw error

  // Create review activity if this is a new or updated review (not deletion)
  if (review && current && !current.review) {
    import('./activity-queries').then(({ createReviewActivity }) => {
      createReviewActivity(current.user_id, current.game_id)
        .catch(console.error)
    })
  }

  return result
}

/**
 * Get user's review for a specific game
 */
export async function getUserReviewForGame(
  userId: string,
  gameId: string
): Promise<{ id: string; review: string | null; rating: number | null } | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_games')
    .select('id, review, rating')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .maybeSingle()

  if (error) throw error
  return data
}
