/**
 * Marketplace Feedback Queries
 *
 * CRUD operations for marketplace feedback and reputation.
 *
 * NOTE: This file uses type casting (`as any`) to bypass TypeScript errors
 * until database types are regenerated after running migrations.
 * Run: npx supabase gen types typescript --local > src/types/supabase.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from './client'
import type {
  MarketplaceFeedback,
  FeedbackWithDetails,
  FeedbackResponse,
  UserReputationStats,
  FeedbackAbility,
  FeedbackRole,
  TrustLevel,
} from '@/types/marketplace'
import { MARKETPLACE_PAGINATION } from '@/lib/config/marketplace-constants'

// =====================================================
// FEEDBACK QUERIES
// =====================================================

/**
 * Leave feedback for a completed transaction
 * Uses RPC function to ensure transaction is completed and user is a participant
 */
export async function leaveFeedback(
  transactionId: string,
  userId: string,
  rating: number,
  comment?: string
): Promise<MarketplaceFeedback> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .rpc('leave_feedback', {
      p_transaction_id: transactionId,
      p_user_id: userId,
      p_rating: rating,
      p_comment: comment || null,
    })

  if (error) {
    console.error('Error leaving feedback:', error)
    throw error
  }

  return data as MarketplaceFeedback
}

/**
 * Get feedback for a user with pagination
 */
export async function getUserFeedback(
  userId: string,
  options: {
    role?: FeedbackRole | null
    limit?: number
    offset?: number
  } = {}
): Promise<FeedbackResponse> {
  const supabase = createClient()
  const limit = options.limit || MARKETPLACE_PAGINATION.FEEDBACK_PAGE_SIZE || 20
  const offset = options.offset || 0

  const { data, error } = await (supabase as any)
    .rpc('get_user_feedback', {
      p_user_id: userId,
      p_role: options.role || null,
      p_limit: limit,
      p_offset: offset,
    })

  if (error) {
    console.error('Error fetching user feedback:', error)
    throw error
  }

  // Also get total count
  let countQuery = (supabase as any)
    .from('marketplace_feedback')
    .select('*', { count: 'exact', head: true })
    .eq('reviewee_id', userId)

  if (options.role) {
    countQuery = countQuery.eq('role', options.role)
  }

  const { count } = await countQuery

  const feedback: FeedbackWithDetails[] = (data || []).map((item: Record<string, unknown>) => ({
    id: item.feedback_id as string,
    transaction_id: item.transaction_id as string,
    reviewer_id: item.reviewer_id as string,
    reviewee_id: userId,
    role: item.role as FeedbackRole,
    rating: item.rating as number,
    comment: item.comment as string | null,
    is_positive: (item.rating as number) >= 4,
    created_at: item.created_at as string,
    updated_at: item.created_at as string,
    reviewer: {
      id: item.reviewer_id as string,
      username: item.reviewer_username as string | null,
      display_name: item.reviewer_display_name as string | null,
      avatar_url: item.reviewer_avatar as string | null,
      custom_avatar_url: null,
    },
    game_name: item.game_name as string,
    game_slug: item.game_slug as string,
    game_image: item.game_image as string | null,
  }))

  return {
    feedback,
    total: count || 0,
    hasMore: offset + limit < (count || 0),
  }
}

/**
 * Get feedback for a specific transaction
 */
export async function getTransactionFeedback(
  transactionId: string
): Promise<{ buyerFeedback: MarketplaceFeedback | null; sellerFeedback: MarketplaceFeedback | null }> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('marketplace_feedback')
    .select('*')
    .eq('transaction_id', transactionId)

  if (error) {
    console.error('Error fetching transaction feedback:', error)
    throw error
  }

  const feedback = data as MarketplaceFeedback[]

  return {
    buyerFeedback: feedback.find(f => f.role === 'buyer') || null,
    sellerFeedback: feedback.find(f => f.role === 'seller') || null,
  }
}

/**
 * Check if a user can leave feedback for a transaction
 */
export async function canLeaveFeedback(
  transactionId: string,
  userId: string
): Promise<FeedbackAbility> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .rpc('can_leave_feedback', {
      p_transaction_id: transactionId,
      p_user_id: userId,
    })

  if (error) {
    console.error('Error checking feedback ability:', error)
    return {
      can_leave: false,
      reason: error.message,
      already_left: false,
      role: null,
    }
  }

  // RPC returns a single row
  const row = Array.isArray(data) ? data[0] : data

  return {
    can_leave: row?.can_leave || false,
    reason: row?.reason || null,
    already_left: row?.already_left || false,
    role: row?.role || null,
  }
}

// =====================================================
// REPUTATION QUERIES
// =====================================================

/**
 * Get reputation stats for a user
 */
export async function getUserReputation(userId: string): Promise<UserReputationStats | null> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .rpc('get_user_reputation', {
      p_user_id: userId,
    })

  if (error) {
    console.error('Error fetching user reputation:', error)
    return null
  }

  // RPC returns a single row
  const row = Array.isArray(data) ? data[0] : data

  if (!row) return null

  return {
    user_id: row.user_id as string,
    seller_feedback_count: Number(row.seller_feedback_count) || 0,
    seller_rating: row.seller_rating !== null ? Number(row.seller_rating) : null,
    seller_five_star_count: Number(row.seller_five_star_count) || 0,
    seller_positive_count: Number(row.seller_positive_count) || 0,
    seller_negative_count: Number(row.seller_negative_count) || 0,
    buyer_feedback_count: Number(row.buyer_feedback_count) || 0,
    buyer_rating: row.buyer_rating !== null ? Number(row.buyer_rating) : null,
    total_feedback_count: Number(row.total_feedback_count) || 0,
    overall_rating: row.overall_rating !== null ? Number(row.overall_rating) : null,
    trust_level: (row.trust_level as TrustLevel) || 'new',
    total_sales: Number(row.total_sales) || 0,
    total_purchases: Number(row.total_purchases) || 0,
  }
}

/**
 * Get reputation stats for a seller (optimized for listing display)
 */
export async function getSellerReputation(sellerId: string): Promise<{
  rating: number | null
  feedbackCount: number
  salesCount: number
  trustLevel: TrustLevel
} | null> {
  const reputation = await getUserReputation(sellerId)

  if (!reputation) return null

  return {
    rating: reputation.seller_rating,
    feedbackCount: reputation.seller_feedback_count,
    salesCount: reputation.total_sales,
    trustLevel: reputation.trust_level,
  }
}

/**
 * Get reputation stats for multiple users (batch query)
 */
export async function getBatchUserReputation(
  userIds: string[]
): Promise<Map<string, UserReputationStats>> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('seller_reputation_stats')
    .select('*')
    .in('user_id', userIds)

  if (error) {
    console.error('Error fetching batch reputation:', error)
    return new Map()
  }

  const result = new Map<string, UserReputationStats>()

  for (const row of (data || [])) {
    result.set(row.user_id, {
      user_id: row.user_id as string,
      seller_feedback_count: Number(row.seller_feedback_count) || 0,
      seller_rating: row.seller_rating !== null ? Number(row.seller_rating) : null,
      seller_five_star_count: Number(row.seller_five_star_count) || 0,
      seller_positive_count: Number(row.seller_positive_count) || 0,
      seller_negative_count: Number(row.seller_negative_count) || 0,
      buyer_feedback_count: Number(row.buyer_feedback_count) || 0,
      buyer_rating: row.buyer_rating !== null ? Number(row.buyer_rating) : null,
      total_feedback_count: Number(row.total_feedback_count) || 0,
      overall_rating: row.overall_rating !== null ? Number(row.overall_rating) : null,
      trust_level: (row.trust_level as TrustLevel) || 'new',
      total_sales: Number(row.total_sales) || 0,
      total_purchases: Number(row.total_purchases) || 0,
    })
  }

  return result
}

// =====================================================
// FEEDBACK STATS
// =====================================================

/**
 * Get feedback statistics breakdown for a user
 */
export async function getFeedbackBreakdown(userId: string): Promise<{
  total: number
  positive: number
  neutral: number
  negative: number
  ratings: { [key: number]: number }
}> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('marketplace_feedback')
    .select('rating')
    .eq('reviewee_id', userId)

  if (error) {
    console.error('Error fetching feedback breakdown:', error)
    return {
      total: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      ratings: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    }
  }

  const ratings: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let positive = 0
  let neutral = 0
  let negative = 0

  for (const row of (data || [])) {
    const rating = row.rating as number
    ratings[rating] = (ratings[rating] || 0) + 1

    if (rating >= 4) positive++
    else if (rating === 3) neutral++
    else negative++
  }

  return {
    total: (data || []).length,
    positive,
    neutral,
    negative,
    ratings,
  }
}

/**
 * Get recent feedback for a user (for profile display)
 */
export async function getRecentFeedback(
  userId: string,
  limit: number = 5
): Promise<FeedbackWithDetails[]> {
  const result = await getUserFeedback(userId, { limit })
  return result.feedback
}
