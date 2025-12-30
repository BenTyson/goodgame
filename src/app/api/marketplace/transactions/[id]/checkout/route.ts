/**
 * Transaction Checkout API
 *
 * POST - Create Stripe Checkout session for a transaction
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/stripe/connect'
import {
  getTransactionById,
  setCheckoutSessionId,
  getUserMarketplaceSettings,
} from '@/lib/supabase/transaction-queries'
import type { CheckoutSessionResponse } from '@/types/marketplace'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST - Create Stripe Checkout session
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transaction = await getTransactionById(id)

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Verify user is the buyer
    if (transaction.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Only the buyer can pay' }, { status: 403 })
    }

    // Verify transaction is awaiting payment
    if (transaction.status !== 'pending_payment') {
      return NextResponse.json(
        { error: 'Transaction is not awaiting payment' },
        { status: 400 }
      )
    }

    // Get seller's Stripe account
    const sellerSettings = await getUserMarketplaceSettings(transaction.seller_id)
    if (!sellerSettings?.stripeAccountId) {
      return NextResponse.json(
        { error: 'Seller has not set up payments' },
        { status: 400 }
      )
    }

    // Get game image for checkout
    const gameImage = transaction.listing?.game?.box_image_url
      || transaction.listing?.game?.thumbnail_url

    // Create checkout session
    const session = await createCheckoutSession({
      amountCents: transaction.amount_cents,
      shippingCents: transaction.shipping_cents,
      sellerStripeAccountId: sellerSettings.stripeAccountId,
      transactionId: id,
      buyerId: user.id,
      sellerId: transaction.seller_id,
      listingTitle: transaction.listing?.title || transaction.listing?.game?.name || 'Board Game',
      gameImageUrl: gameImage || undefined,
      successUrl: `${APP_URL}/marketplace/transactions/${id}?payment=success`,
      cancelUrl: `${APP_URL}/marketplace/transactions/${id}?payment=cancelled`,
    })

    // Save checkout session ID to transaction
    await setCheckoutSessionId(id, session.id)

    return NextResponse.json<CheckoutSessionResponse>({
      checkout_url: session.url!,
      session_id: session.id,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
