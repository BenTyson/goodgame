/**
 * Activity Feed Queries
 * Client-side queries for activity feed operations
 */

import { createClient } from './client'
import type {
  ActivityWithDetails,
  ActivityFeedResponse,
  UserActivityInsert,
  ShelfStatus,
} from '@/types/database'

const FEED_PAGE_SIZE = 20

/**
 * Get activity feed for current user (activities from people they follow)
 * Uses cursor-based pagination for infinite scroll
 */
export async function getActivityFeed(
  userId: string,
  cursor?: string,
  limit = FEED_PAGE_SIZE
): Promise<ActivityFeedResponse> {
  const supabase = createClient()

  // First get the list of users this person follows
  const { data: following } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (!following || following.length === 0) {
    return { activities: [], hasMore: false }
  }

  const followedUserIds = following.map(f => f.following_id)

  // Build the query for activities
  let query = supabase
    .from('user_activities')
    .select(`
      *,
      user:user_profiles!user_id(id, username, display_name, avatar_url, custom_avatar_url),
      target_user:user_profiles!target_user_id(id, username, display_name, avatar_url, custom_avatar_url),
      game:games!game_id(id, name, slug, box_image_url, thumbnail_url)
    `)
    .in('user_id', followedUserIds)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  // Apply cursor if provided (cursor is the created_at timestamp)
  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query

  if (error) throw error

  const hasMore = data && data.length > limit
  const activities = (data?.slice(0, limit) || []) as ActivityWithDetails[]
  const lastCreatedAt = hasMore && activities.length > 0
    ? activities[activities.length - 1].created_at
    : null
  const nextCursor = lastCreatedAt ?? undefined

  return {
    activities,
    hasMore,
    nextCursor,
  }
}

/**
 * Get a specific user's activities (for their public profile)
 */
export async function getUserActivities(
  userId: string,
  cursor?: string,
  limit = FEED_PAGE_SIZE
): Promise<ActivityFeedResponse> {
  const supabase = createClient()

  let query = supabase
    .from('user_activities')
    .select(`
      *,
      user:user_profiles!user_id(id, username, display_name, avatar_url, custom_avatar_url),
      target_user:user_profiles!target_user_id(id, username, display_name, avatar_url, custom_avatar_url),
      game:games!game_id(id, name, slug, box_image_url, thumbnail_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query

  if (error) throw error

  const hasMore = data && data.length > limit
  const activities = (data?.slice(0, limit) || []) as ActivityWithDetails[]
  const lastCreatedAt = hasMore && activities.length > 0
    ? activities[activities.length - 1].created_at
    : null
  const nextCursor = lastCreatedAt ?? undefined

  return {
    activities,
    hasMore,
    nextCursor,
  }
}

/**
 * Create a new activity (called when actions happen)
 */
export async function createActivity(
  activity: UserActivityInsert
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_activities')
    .insert(activity)

  if (error) {
    // Log but don't throw - activity creation shouldn't block primary actions
    console.error('Error creating activity:', error)
  }
}

/**
 * Helper: Create follow activity
 */
export async function createFollowActivity(
  followerId: string,
  followingId: string
): Promise<void> {
  return createActivity({
    user_id: followerId,
    activity_type: 'follow',
    target_user_id: followingId,
    metadata: {},
  })
}

/**
 * Helper: Create shelf activity
 */
export async function createShelfActivity(
  userId: string,
  gameId: string,
  status: ShelfStatus,
  isUpdate = false,
  oldStatus?: ShelfStatus
): Promise<void> {
  return createActivity({
    user_id: userId,
    activity_type: isUpdate ? 'shelf_update' : 'shelf_add',
    game_id: gameId,
    metadata: isUpdate
      ? { old_status: oldStatus, new_status: status }
      : { status },
  })
}

/**
 * Helper: Create rating activity
 */
export async function createRatingActivity(
  userId: string,
  gameId: string,
  rating: number
): Promise<void> {
  return createActivity({
    user_id: userId,
    activity_type: 'rating',
    game_id: gameId,
    metadata: { rating },
  })
}

/**
 * Helper: Create top games update activity
 */
export async function createTopGamesActivity(
  userId: string,
  changes: { added?: string[]; removed?: string[]; reordered?: boolean }
): Promise<void> {
  return createActivity({
    user_id: userId,
    activity_type: 'top_games_update',
    metadata: changes,
  })
}

/**
 * Helper: Create review activity
 */
export async function createReviewActivity(
  userId: string,
  gameId: string
): Promise<void> {
  return createActivity({
    user_id: userId,
    activity_type: 'review',
    game_id: gameId,
    metadata: {},
  })
}
