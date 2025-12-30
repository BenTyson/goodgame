/**
 * User Reputation API
 *
 * GET - Get reputation stats and recent feedback for a user
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getUserReputation,
  getRecentFeedback,
  getFeedbackBreakdown,
} from '@/lib/supabase/feedback-queries'
import type { ReputationResponse } from '@/types/marketplace'

interface RouteParams {
  params: Promise<{ userId: string }>
}

/**
 * GET - Get reputation stats for a user
 * Query params:
 * - include_feedback: Include recent feedback (default: true)
 * - include_breakdown: Include rating breakdown (default: false)
 * - feedback_limit: Number of recent feedback to include (default: 5)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const includeFeedback = searchParams.get('include_feedback') !== 'false'
    const includeBreakdown = searchParams.get('include_breakdown') === 'true'
    const feedbackLimit = parseInt(searchParams.get('feedback_limit') || '5', 10)

    // Get reputation stats
    const reputation = await getUserReputation(userId)

    if (!reputation) {
      // Return default stats for user with no marketplace activity
      return NextResponse.json({
        reputation: {
          user_id: userId,
          seller_feedback_count: 0,
          seller_rating: null,
          seller_five_star_count: 0,
          seller_positive_count: 0,
          seller_negative_count: 0,
          buyer_feedback_count: 0,
          buyer_rating: null,
          total_feedback_count: 0,
          overall_rating: null,
          trust_level: 'new',
          total_sales: 0,
          total_purchases: 0,
        },
        recent_feedback: [],
      } as ReputationResponse)
    }

    // Get recent feedback if requested
    let recent_feedback = []
    if (includeFeedback) {
      recent_feedback = await getRecentFeedback(userId, feedbackLimit)
    }

    // Get breakdown if requested
    let breakdown = null
    if (includeBreakdown) {
      breakdown = await getFeedbackBreakdown(userId)
    }

    return NextResponse.json({
      reputation,
      recent_feedback,
      ...(breakdown ? { breakdown } : {}),
    })
  } catch (error) {
    console.error('Error fetching reputation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reputation' },
      { status: 500 }
    )
  }
}
