/**
 * Friend Queries
 * Mutual friends system - users who follow each other are friends
 *
 * Note: These queries use database functions defined in migration 00077_friends_system.sql
 * After running the migration, regenerate types with:
 * npx supabase gen types typescript --linked > src/types/supabase.ts
 */

import { createClient } from './client'
import type {
  Friend,
  FriendWithProfile,
  SuggestedFriend,
  FriendOfFriend,
  RecentlyActiveUser,
  UserSearchResult,
  ShelfComparisonResult,
  ShelfComparisonGame,
} from '@/types/database'

// Helper to call RPC functions that aren't in the generated types yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRpc = any

/**
 * Get mutual friends for a user (both users follow each other)
 */
export async function getMutualFriends(userId: string): Promise<FriendWithProfile[]> {
  const supabase = createClient()

  const { data, error } = await (supabase.rpc as AnyRpc)('get_mutual_friends', {
    p_user_id: userId,
  })

  if (error) {
    console.error('Error fetching mutual friends:', error)
    return []
  }

  return (data || []).map((row: {
    friend_id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
    custom_avatar_url: string | null
    bio: string | null
    last_active_at: string | null
    followed_at: string
    mutual_games_count: number
  }) => ({
    id: row.friend_id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    customAvatarUrl: row.custom_avatar_url,
    bio: row.bio,
    lastActiveAt: row.last_active_at,
    followedAt: row.followed_at,
    mutualGamesCount: row.mutual_games_count,
  }))
}

/**
 * Check if two users are friends (mutual follows)
 */
export async function areFriends(userId1: string, userId2: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await (supabase.rpc as AnyRpc)('are_friends', {
    p_user1: userId1,
    p_user2: userId2,
  })

  if (error) {
    console.error('Error checking friendship:', error)
    return false
  }

  return data === true
}

/**
 * Get count of mutual friends for a user
 */
export async function getFriendCount(userId: string): Promise<number> {
  const supabase = createClient()

  const { data, error } = await (supabase.rpc as AnyRpc)('get_friend_count', {
    p_user_id: userId,
  })

  if (error) {
    console.error('Error fetching friend count:', error)
    return 0
  }

  return data || 0
}

/**
 * Get friend suggestions based on mutual games
 */
export async function getSuggestedFriends(
  userId: string,
  limit: number = 10
): Promise<SuggestedFriend[]> {
  const supabase = createClient()

  const { data, error } = await (supabase.rpc as AnyRpc)('get_friend_suggestions', {
    p_user_id: userId,
    p_limit: limit,
  })

  if (error) {
    console.error('Error fetching friend suggestions:', error)
    return []
  }

  return (data || []).map((row: {
    user_id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
    custom_avatar_url: string | null
    bio: string | null
    last_active_at: string | null
    mutual_games_count: number
    sample_mutual_games: string[] | null
  }) => ({
    id: row.user_id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    customAvatarUrl: row.custom_avatar_url,
    bio: row.bio,
    lastActiveAt: row.last_active_at,
    mutualGamesCount: row.mutual_games_count,
    sampleMutualGames: row.sample_mutual_games || [],
  }))
}

/**
 * Get friends of friends who aren't already friends
 */
export async function getFriendsOfFriends(
  userId: string,
  limit: number = 10
): Promise<FriendOfFriend[]> {
  const supabase = createClient()

  const { data, error } = await (supabase.rpc as AnyRpc)('get_friends_of_friends', {
    p_user_id: userId,
    p_limit: limit,
  })

  if (error) {
    console.error('Error fetching friends of friends:', error)
    return []
  }

  return (data || []).map((row: {
    user_id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
    custom_avatar_url: string | null
    bio: string | null
    last_active_at: string | null
    mutual_friend_count: number
    mutual_friend_names: string[] | null
  }) => ({
    id: row.user_id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    customAvatarUrl: row.custom_avatar_url,
    bio: row.bio,
    lastActiveAt: row.last_active_at,
    mutualFriendCount: row.mutual_friend_count,
    mutualFriendNames: row.mutual_friend_names || [],
  }))
}

/**
 * Get recently active users for discovery
 */
export async function getRecentlyActiveUsers(
  userId: string,
  limit: number = 10
): Promise<RecentlyActiveUser[]> {
  const supabase = createClient()

  const { data, error } = await (supabase.rpc as AnyRpc)('get_recently_active_users', {
    p_user_id: userId,
    p_limit: limit,
  })

  if (error) {
    console.error('Error fetching recently active users:', error)
    return []
  }

  return (data || []).map((row: {
    user_id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
    custom_avatar_url: string | null
    bio: string | null
    last_active_at: string | null
    recent_activity_summary: string | null
  }) => ({
    id: row.user_id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    customAvatarUrl: row.custom_avatar_url,
    bio: row.bio,
    lastActiveAt: row.last_active_at,
    recentActivitySummary: row.recent_activity_summary,
  }))
}

/**
 * Search users by username or display name
 */
export async function searchUsers(
  query: string,
  currentUserId?: string,
  limit: number = 20
): Promise<UserSearchResult[]> {
  const supabase = createClient()

  const { data, error } = await (supabase.rpc as AnyRpc)('search_users', {
    p_query: query,
    p_current_user_id: currentUserId || null,
    p_limit: limit,
  })

  if (error) {
    console.error('Error searching users:', error)
    return []
  }

  return (data || []).map((row: {
    user_id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
    custom_avatar_url: string | null
    bio: string | null
    is_following: boolean
    is_friend: boolean
  }) => ({
    id: row.user_id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    customAvatarUrl: row.custom_avatar_url,
    bio: row.bio,
    isFollowing: row.is_following,
    isFriend: row.is_friend,
  }))
}

/**
 * Get shelf comparison between two users
 */
export async function getShelfComparison(
  userId1: string,
  userId2: string
): Promise<ShelfComparisonResult> {
  const supabase = createClient()

  const { data, error } = await (supabase.rpc as AnyRpc)('get_shelf_comparison', {
    p_user1: userId1,
    p_user2: userId2,
  })

  if (error) {
    console.error('Error fetching shelf comparison:', error)
    return { both: [], onlyUser1: [], onlyUser2: [] }
  }

  const both: ShelfComparisonGame[] = []
  const onlyUser1: ShelfComparisonGame[] = []
  const onlyUser2: ShelfComparisonGame[] = []

  for (const row of data || []) {
    const game: ShelfComparisonGame = {
      id: row.game_id,
      name: row.game_name,
      slug: row.game_slug,
      boxImageUrl: row.box_image_url,
      thumbnailUrl: row.thumbnail_url,
      user1Status: row.user1_status,
      user2Status: row.user2_status,
    }

    if (row.category === 'both') {
      both.push(game)
    } else if (row.category === 'only_user1') {
      onlyUser1.push(game)
    } else if (row.category === 'only_user2') {
      onlyUser2.push(game)
    }
  }

  return { both, onlyUser1, onlyUser2 }
}

/**
 * Get mutual friends count between two users
 */
export async function getMutualFriendsCount(
  userId1: string,
  userId2: string
): Promise<number> {
  const supabase = createClient()

  // Get friends of both users and find intersection
  const [friends1, friends2] = await Promise.all([
    getMutualFriends(userId1),
    getMutualFriends(userId2),
  ])

  const friends1Ids = new Set(friends1.map((f) => f.id))
  const mutualCount = friends2.filter((f) => friends1Ids.has(f.id)).length

  return mutualCount
}

/**
 * Get mutual friends between two users (the actual users, not just count)
 */
export async function getMutualFriendsBetween(
  userId1: string,
  userId2: string
): Promise<Friend[]> {
  const [friends1, friends2] = await Promise.all([
    getMutualFriends(userId1),
    getMutualFriends(userId2),
  ])

  const friends1Ids = new Set(friends1.map((f) => f.id))
  const mutual = friends2.filter((f) => friends1Ids.has(f.id))

  return mutual.map((f) => ({
    id: f.id,
    username: f.username,
    displayName: f.displayName,
    avatarUrl: f.avatarUrl,
    customAvatarUrl: f.customAvatarUrl,
  }))
}

/**
 * Get users that the current user follows but who don't follow back (one-way follows)
 */
export async function getFollowingNonFriends(userId: string): Promise<Friend[]> {
  const supabase = createClient()

  // Get all people they follow
  const { data: following, error: followingError } = await supabase
    .from('user_follows')
    .select(`
      following_id,
      following:user_profiles!user_follows_following_id_fkey (
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      )
    `)
    .eq('follower_id', userId)

  if (followingError) {
    console.error('Error fetching following:', followingError)
    return []
  }

  // Get friends (mutual follows) to exclude them
  const friends = await getMutualFriends(userId)
  const friendIds = new Set(friends.map(f => f.id))

  // Filter to only non-friends
  return (following || [])
    .filter(f => f.following && !friendIds.has(f.following_id))
    .map(f => {
      const profile = f.following as {
        id: string
        username: string | null
        display_name: string | null
        avatar_url: string | null
        custom_avatar_url: string | null
      }
      return {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        customAvatarUrl: profile.custom_avatar_url,
      }
    })
}
