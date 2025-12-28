/**
 * Social Queries
 * Follow/unfollow functionality and follower/following lists
 */

import { createClient } from './client'
import type {
  UserFollowWithFollower,
  UserFollowWithFollowing,
  FollowStats,
} from '@/types/database'

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
