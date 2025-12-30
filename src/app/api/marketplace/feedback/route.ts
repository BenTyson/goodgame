/**
 * Feedback API
 *
 * GET - List user's feedback (received)
 * POST - Leave feedback for a completed transaction
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  leaveFeedback,
  getUserFeedback,
  canLeaveFeedback,
} from '@/lib/supabase/feedback-queries'
import type { FeedbackResponse, FeedbackRole, CreateFeedbackRequest } from '@/types/marketplace'
import { FEEDBACK_SETTINGS, MARKETPLACE_PAGINATION } from '@/lib/config/marketplace-constants'

/**
 * GET - List feedback for a user
 * Query params:
 * - user_id: User to get feedback for (optional, defaults to current user)
 * - role: Filter by 'buyer' or 'seller' (optional)
 * - limit: Number of items per page
 * - offset: Pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id') || user?.id
    const role = searchParams.get('role') as FeedbackRole | null
    const limit = parseInt(searchParams.get('limit') || String(MARKETPLACE_PAGINATION.FEEDBACK_PAGE_SIZE), 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const result = await getUserFeedback(userId, {
      role: role || null,
      limit,
      offset,
    })

    return NextResponse.json<FeedbackResponse>(result)
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}

/**
 * POST - Leave feedback for a completed transaction
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as CreateFeedbackRequest
    const { transaction_id: transactionId, rating, comment } = body

    // Validate required fields
    if (!transactionId) {
      return NextResponse.json(
        { error: 'transaction_id is required' },
        { status: 400 }
      )
    }

    // Validate rating
    if (
      typeof rating !== 'number' ||
      rating < FEEDBACK_SETTINGS.MIN_RATING ||
      rating > FEEDBACK_SETTINGS.MAX_RATING
    ) {
      return NextResponse.json(
        { error: `Rating must be between ${FEEDBACK_SETTINGS.MIN_RATING} and ${FEEDBACK_SETTINGS.MAX_RATING}` },
        { status: 400 }
      )
    }

    // Validate comment length
    if (comment && comment.length > FEEDBACK_SETTINGS.MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `Comment must be ${FEEDBACK_SETTINGS.MAX_COMMENT_LENGTH} characters or less` },
        { status: 400 }
      )
    }

    // Check if user can leave feedback
    const ability = await canLeaveFeedback(transactionId, user.id)

    if (!ability.can_leave) {
      return NextResponse.json(
        { error: ability.reason || 'Cannot leave feedback for this transaction' },
        { status: 400 }
      )
    }

    // Leave feedback
    const feedback = await leaveFeedback(
      transactionId,
      user.id,
      rating,
      comment
    )

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Error leaving feedback:', error)
    return NextResponse.json(
      { error: 'Failed to leave feedback' },
      { status: 500 }
    )
  }
}
