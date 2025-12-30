/**
 * Transaction Feedback API
 *
 * GET - Get feedback for a specific transaction
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getTransactionFeedback,
  canLeaveFeedback,
} from '@/lib/supabase/feedback-queries'

interface RouteParams {
  params: Promise<{ transactionId: string }>
}

/**
 * GET - Get feedback for a transaction and check if user can leave feedback
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { transactionId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get existing feedback for the transaction
    const { buyerFeedback, sellerFeedback } = await getTransactionFeedback(transactionId)

    // Check if current user can leave feedback
    let ability = null
    if (user) {
      ability = await canLeaveFeedback(transactionId, user.id)
    }

    return NextResponse.json({
      buyerFeedback,
      sellerFeedback,
      canLeaveFeedback: ability?.can_leave || false,
      alreadyLeft: ability?.already_left || false,
      userRole: ability?.role || null,
    })
  } catch (error) {
    console.error('Error fetching transaction feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}
