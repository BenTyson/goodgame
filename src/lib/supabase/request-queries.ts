import { createAdminClient } from './admin'
import { createClient } from './server'

/**
 * Content request queries for preview game pages
 */

/**
 * Get the request count for a game
 * Uses a direct count query for accuracy
 */
export async function getGameRequestCount(gameId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('content_requests')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', gameId)

  if (error) {
    console.error('Failed to get request count:', error)
    return 0
  }

  return count || 0
}

/**
 * Check if a user has already requested content for a game
 */
export async function hasUserRequested(gameId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('content_requests')
    .select('id')
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Failed to check user request:', error)
    return false
  }

  return !!data
}

/**
 * Check if an IP hash has already requested content for a game (anonymous users)
 */
export async function hasIpRequested(gameId: string, ipHash: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('content_requests')
    .select('id')
    .eq('game_id', gameId)
    .eq('ip_hash', ipHash)
    .maybeSingle()

  if (error) {
    console.error('Failed to check IP request:', error)
    return false
  }

  return !!data
}

/**
 * Create a content request for a game
 * Handles both authenticated and anonymous requests
 */
export async function createContentRequest(
  gameId: string,
  userId?: string,
  ipHash?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient()

  // Determine which identifier to use
  if (!userId && !ipHash) {
    return { success: false, error: 'Either userId or ipHash is required' }
  }

  try {
    const { error } = await supabase
      .from('content_requests')
      .insert({
        game_id: gameId,
        user_id: userId || null,
        ip_hash: userId ? null : ipHash,  // Only use ipHash for anonymous users
      })

    if (error) {
      // Handle duplicate key violations gracefully
      if (error.code === '23505') {
        return { success: true }  // Already requested, treat as success
      }
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to create content request:', error)
    return { success: false, error: 'Failed to create request' }
  }
}

/**
 * Get the top requested games for admin prioritization
 */
export async function getTopRequestedGames(limit = 20): Promise<
  Array<{ game_id: string; request_count: number; last_request_at: string }>
> {
  const supabase = createAdminClient()

  // First try the materialized view (faster but may be stale)
  const { data: viewData, error: viewError } = await supabase
    .from('game_request_counts')
    .select('game_id, request_count, last_request_at')
    .order('request_count', { ascending: false })
    .limit(limit)

  if (!viewError && viewData && viewData.length > 0) {
    // Filter out any rows with null values and map to required shape
    return viewData
      .filter((row): row is { game_id: string; request_count: number; last_request_at: string } =>
        row.game_id !== null && row.request_count !== null && row.last_request_at !== null
      )
  }

  // Fallback to direct query if materialized view is empty or errored
  const { data, error } = await supabase
    .from('content_requests')
    .select('game_id')

  if (error || !data) {
    console.error('Failed to get top requested games:', error)
    return []
  }

  // Group by game_id and count
  const counts = new Map<string, { count: number; lastAt: string }>()
  for (const row of data) {
    const existing = counts.get(row.game_id)
    if (existing) {
      existing.count++
    } else {
      counts.set(row.game_id, { count: 1, lastAt: new Date().toISOString() })
    }
  }

  return Array.from(counts.entries())
    .map(([game_id, { count, lastAt }]) => ({
      game_id,
      request_count: count,
      last_request_at: lastAt,
    }))
    .sort((a, b) => b.request_count - a.request_count)
    .slice(0, limit)
}

/**
 * Refresh the materialized view for request counts
 * Should be called periodically (e.g., every hour) or after batch inserts
 */
export async function refreshRequestCountsView(): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase.rpc('refresh_game_request_counts')

  if (error) {
    console.error('Failed to refresh request counts view:', error)
  }
}
