/**
 * Vibe Queries
 * Game vibes (ratings) with social features and statistics
 */

import { createClient } from './client'
import type {
  GameVibeStats,
  VibeWithUser,
  FriendVibe,
  VibesResponse,
  VibeDistribution,
  VibeSortOption,
  VibeFilterOption,
} from '@/types/database'

const VIBES_PAGE_SIZE = 20

/**
 * Get vibe statistics for a game (calculated from user_games)
 */
export async function getGameVibeStats(gameId: string): Promise<GameVibeStats> {
  const supabase = createClient()

  // Get all ratings for this game from users with public profiles
  const { data, error } = await supabase
    .from('user_games')
    .select(`
      rating,
      review,
      user:user_profiles!user_id(
        profile_visibility,
        shelf_visibility
      )
    `)
    .eq('game_id', gameId)
    .not('rating', 'is', null)

  if (error) {
    console.error('Error fetching vibe stats:', error)
    return createEmptyStats(gameId)
  }

  // Filter to only public profiles
  const publicVibes = (data || []).filter((item) => {
    const user = item.user as { profile_visibility?: string; shelf_visibility?: string } | null
    return user?.profile_visibility === 'public' && user?.shelf_visibility === 'public'
  })

  if (publicVibes.length === 0) {
    return createEmptyStats(gameId)
  }

  // Calculate stats
  const ratings = publicVibes.map(v => v.rating as number)
  const vibesWithThoughts = publicVibes.filter(v => v.review !== null).length

  // Distribution
  const distribution: VibeDistribution = {
    '1': 0, '2': 0, '3': 0, '4': 0, '5': 0,
    '6': 0, '7': 0, '8': 0, '9': 0, '10': 0,
  }
  ratings.forEach(r => {
    const key = r.toString() as keyof VibeDistribution
    distribution[key]++
  })

  // Average
  const sum = ratings.reduce((a, b) => a + b, 0)
  const average = sum / ratings.length

  // Median
  const sorted = [...ratings].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2

  // Mode
  const frequency: Record<number, number> = {}
  let maxFreq = 0
  let mode = ratings[0]
  ratings.forEach(r => {
    frequency[r] = (frequency[r] || 0) + 1
    if (frequency[r] > maxFreq) {
      maxFreq = frequency[r]
      mode = r
    }
  })

  // Standard deviation
  const variance = ratings.reduce((acc, r) => acc + Math.pow(r - average, 2), 0) / ratings.length
  const stddev = Math.sqrt(variance)

  return {
    gameId,
    vibeCount: ratings.length,
    averageVibe: Math.round(average * 100) / 100,
    vibeStddev: Math.round(stddev * 100) / 100,
    medianVibe: median,
    modeVibe: mode,
    distribution,
    vibesWithThoughts,
  }
}

/**
 * Create empty stats object
 */
function createEmptyStats(gameId: string): GameVibeStats {
  return {
    gameId,
    vibeCount: 0,
    averageVibe: null,
    vibeStddev: null,
    medianVibe: null,
    modeVibe: null,
    distribution: {
      '1': 0, '2': 0, '3': 0, '4': 0, '5': 0,
      '6': 0, '7': 0, '8': 0, '9': 0, '10': 0,
    },
    vibesWithThoughts: 0,
  }
}

/**
 * Get paginated vibes for a game with filtering and sorting
 */
export async function getGameVibes(
  gameId: string,
  options: {
    cursor?: string
    limit?: number
    sort?: VibeSortOption
    filter?: VibeFilterOption
  } = {}
): Promise<VibesResponse> {
  const supabase = createClient()
  const {
    cursor,
    limit = VIBES_PAGE_SIZE,
    sort = 'newest',
    filter = 'all',
  } = options

  let query = supabase
    .from('user_games')
    .select(`
      id,
      user_id,
      game_id,
      rating,
      review,
      created_at,
      updated_at,
      user:user_profiles!user_id(
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url,
        profile_visibility,
        shelf_visibility
      )
    `)
    .eq('game_id', gameId)
    .not('rating', 'is', null)

  // Apply filter
  if (filter === 'with_thoughts') {
    query = query.not('review', 'is', null)
  } else if (typeof filter === 'number') {
    query = query.eq('rating', filter)
  }

  // Apply sort
  switch (sort) {
    case 'oldest':
      query = query.order('created_at', { ascending: true })
      break
    case 'highest':
      query = query.order('rating', { ascending: false }).order('created_at', { ascending: false })
      break
    case 'lowest':
      query = query.order('rating', { ascending: true }).order('created_at', { ascending: false })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  // Apply cursor pagination
  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  // Fetch one extra to check for more
  query = query.limit(limit + 1)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching vibes:', error)
    return { vibes: [], hasMore: false }
  }

  // Filter out private profiles and map to our type
  const publicVibes = (data || [])
    .filter((item) => {
      const user = item.user as { profile_visibility?: string; shelf_visibility?: string } | null
      return user?.profile_visibility === 'public' && user?.shelf_visibility === 'public'
    })
    .map((item) => mapToVibeWithUser(item))

  const hasMore = publicVibes.length > limit
  const vibes = publicVibes.slice(0, limit)
  const lastVibe = vibes[vibes.length - 1]

  return {
    vibes,
    hasMore,
    nextCursor: hasMore && lastVibe ? lastVibe.createdAt : undefined,
  }
}

/**
 * Get friends' vibes for a game (users the current user follows)
 */
export async function getFriendsVibesJoin(
  userId: string,
  gameId: string
): Promise<FriendVibe[]> {
  const supabase = createClient()

  // First get the list of followed user IDs
  const { data: follows, error: followsError } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (followsError || !follows?.length) {
    return []
  }

  const followedIds = follows.map(f => f.following_id)

  // Then get their vibes for this game
  const { data, error } = await supabase
    .from('user_games')
    .select(`
      id,
      user_id,
      rating,
      review,
      created_at,
      user:user_profiles!user_id(
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url,
        profile_visibility,
        shelf_visibility
      )
    `)
    .eq('game_id', gameId)
    .not('rating', 'is', null)
    .in('user_id', followedIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching friends vibes:', error)
    return []
  }

  return (data || [])
    .filter((item) => {
      const user = item.user as { profile_visibility?: string; shelf_visibility?: string } | null
      return user?.profile_visibility === 'public' && user?.shelf_visibility === 'public'
    })
    .map((item) => ({
      id: item.id,
      userId: item.user_id,
      value: item.rating!,
      thoughts: item.review,
      createdAt: item.created_at || new Date().toISOString(),
      user: mapUser(item.user),
    }))
}

/**
 * Map database user to our type
 */
function mapUser(user: unknown): FriendVibe['user'] {
  const u = user as {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
    custom_avatar_url: string | null
  } | null

  return {
    id: u?.id || '',
    username: u?.username || null,
    displayName: u?.display_name || null,
    avatarUrl: u?.avatar_url || null,
    customAvatarUrl: u?.custom_avatar_url || null,
  }
}

/**
 * Map database row to VibeWithUser type
 */
function mapToVibeWithUser(item: {
  id: string
  user_id: string
  game_id: string
  rating: number | null
  review: string | null
  created_at: string | null
  updated_at?: string | null
  user: unknown
}): VibeWithUser {
  return {
    id: item.id,
    userId: item.user_id,
    gameId: item.game_id,
    value: item.rating!,
    thoughts: item.review,
    createdAt: item.created_at || new Date().toISOString(),
    updatedAt: item.updated_at || null,
    user: mapUser(item.user),
  }
}

/**
 * Get user's own vibe for a game
 */
export async function getUserVibe(
  userId: string,
  gameId: string
): Promise<{ id: string; value: number; thoughts: string | null } | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_games')
    .select('id, rating, review')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .not('rating', 'is', null)
    .maybeSingle()

  if (error || !data) return null

  return {
    id: data.id,
    value: data.rating!,
    thoughts: data.review,
  }
}

/**
 * Calculate spread description based on standard deviation
 */
export function getSpreadDescription(stddev: number | null): string {
  if (stddev === null) return 'No data'
  if (stddev < 1) return 'Tight consensus'
  if (stddev < 2) return 'General agreement'
  if (stddev < 3) return 'Mixed opinions'
  return 'Widely divided'
}
