/**
 * Review Queries
 * Game reviews and aggregate ratings
 */

import { createClient } from './client'
import type { UserGame, UserGameUpdate } from '@/types/database'

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
