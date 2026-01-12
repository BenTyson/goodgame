/**
 * Notification Queries
 * Client-side queries for notification operations
 */

import { createClient } from './client'
import type {
  NotificationWithDetails,
  NotificationsResponse,
} from '@/types/database'

const NOTIFICATIONS_PAGE_SIZE = 20

/**
 * Get unread notification count for current user
 * Returns 0 on error (non-critical feature)
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('user_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    // Silently fail - notifications are non-critical
    return 0
  }
  return count || 0
}

/**
 * Get notifications for current user with cursor-based pagination
 * Returns empty list on error (non-critical feature)
 */
export async function getNotifications(
  userId: string,
  cursor?: string,
  limit = NOTIFICATIONS_PAGE_SIZE
): Promise<NotificationsResponse> {
  const supabase = createClient()

  let query = supabase
    .from('user_notifications')
    .select(`
      *,
      actor:user_profiles!actor_id(id, username, display_name, avatar_url, custom_avatar_url),
      game:games!game_id(id, name, slug, box_image_url, thumbnail_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query

  if (error) {
    // Silently fail - notifications are non-critical
    return { notifications: [], hasMore: false, nextCursor: undefined }
  }

  const hasMore = data && data.length > limit
  const notifications = (data?.slice(0, limit) || []) as NotificationWithDetails[]
  const lastCreatedAt = hasMore && notifications.length > 0
    ? notifications[notifications.length - 1].created_at
    : null
  const nextCursor = lastCreatedAt ?? undefined

  return {
    notifications,
    hasMore,
    nextCursor,
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) throw error
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_notifications')
    .delete()
    .eq('id', notificationId)

  if (error) throw error
}
