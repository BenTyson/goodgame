/**
 * User Queries - Core Profile & Shelf Operations
 *
 * This module handles user profiles, shelf management, and top games.
 * Social features (follows) are in social-queries.ts
 * Reviews are in review-queries.ts
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
} from '@/types/database'

// Re-export social and review queries for backward compatibility
export * from './social-queries'
export * from './review-queries'

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
// MUTUAL GAMES (SOCIAL DISCOVERY)
// =====================================================

export interface MutualGame {
  id: string
  name: string
  slug: string
  box_image_url: string | null
}

/**
 * Get games that both users have in their shelf
 * Used for "Games You Both Have" feature on profile pages
 */
export async function getMutualGames(
  userId1: string,
  userId2: string,
  limit = 12
): Promise<MutualGame[]> {
  const supabase = createClient()

  // Get game IDs from user 1's shelf
  const { data: user1Games, error: error1 } = await supabase
    .from('user_games')
    .select('game_id')
    .eq('user_id', userId1)

  if (error1) throw error1
  if (!user1Games || user1Games.length === 0) return []

  const user1GameIds = user1Games.map(g => g.game_id)

  // Get games from user 2's shelf that are also in user 1's shelf
  const { data: mutualGames, error: error2 } = await supabase
    .from('user_games')
    .select(`
      game:games(id, name, slug, box_image_url)
    `)
    .eq('user_id', userId2)
    .in('game_id', user1GameIds)
    .limit(limit)

  if (error2) throw error2

  // Extract and dedupe games
  const games = (mutualGames || [])
    .map(item => item.game)
    .filter((game): game is MutualGame => game !== null)

  return games
}
