/**
 * Transactions API
 *
 * GET - List user's transactions
 * POST - Create transaction from accepted offer
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateTransactionFees } from '@/lib/stripe/client'
import {
  getTransactionsByUser,
  createTransaction,
  getTransactionByOfferId,
  getUserMarketplaceSettings,
} from '@/lib/supabase/transaction-queries'
import type { TransactionStatus, TransactionsResponse, CreateTransactionRequest } from '@/types/marketplace'

/**
 * GET - List user's transactions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = (searchParams.get('role') || 'buyer') as 'buyer' | 'seller'
    const status = searchParams.get('status') as TransactionStatus | null
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const result = await getTransactionsByUser(user.id, role, {
      status: status || undefined,
      limit,
      offset,
    })

    return NextResponse.json<TransactionsResponse>(result)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create transaction from accepted offer
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as CreateTransactionRequest
    const { offer_id: offerId } = body

    if (!offerId) {
      return NextResponse.json(
        { error: 'offer_id is required' },
        { status: 400 }
      )
    }

    // Check if transaction already exists for this offer
    const existingTransaction = await getTransactionByOfferId(offerId)
    if (existingTransaction) {
      return NextResponse.json({
        transaction: existingTransaction,
        message: 'Transaction already exists',
      })
    }

    // Get offer details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: offer, error: offerError } = await (supabase as any)
      .from('marketplace_offers')
      .select(`
        *,
        listing:marketplace_listings(
          price_cents,
          shipping_cost_cents,
          seller_id
        )
      `)
      .eq('id', offerId)
      .single()

    if (offerError || !offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      )
    }

    // Verify offer is accepted
    if (offer.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Offer must be accepted to create transaction' },
        { status: 400 }
      )
    }

    // Verify user is the buyer
    if (offer.buyer_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the buyer can create a transaction' },
        { status: 403 }
      )
    }

    // Check seller has Stripe Connect set up
    const sellerSettings = await getUserMarketplaceSettings(offer.seller_id)
    if (!sellerSettings?.stripeAccountId || !sellerSettings?.stripeChargesEnabled) {
      return NextResponse.json(
        { error: 'Seller has not set up payments yet' },
        { status: 400 }
      )
    }

    // Calculate amounts
    const amountCents = offer.amount_cents || 0
    const shippingCents = (offer.listing as { shipping_cost_cents: number | null })?.shipping_cost_cents || 0
    const totalAmount = amountCents + shippingCents

    const fees = calculateTransactionFees(totalAmount)

    // Create transaction
    const transaction = await createTransaction({
      offerId,
      amountCents,
      shippingCents,
      platformFeeCents: fees.platformFee,
      stripeFeeCents: fees.stripeFee,
      sellerPayoutCents: fees.sellerPayout,
    })

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
