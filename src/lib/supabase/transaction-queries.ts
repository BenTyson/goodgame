/**
 * Marketplace Transaction Queries
 *
 * CRUD operations for marketplace transactions (payments, shipping, fulfillment).
 *
 * NOTE: This file uses type casting (`as any`) to bypass TypeScript errors
 * until database types are regenerated after running migrations.
 * Run: npx supabase gen types typescript --local > src/types/supabase.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from './client'
import type {
  MarketplaceTransaction,
  MarketplaceTransactionInsert,
  MarketplaceTransactionUpdate,
  TransactionWithDetails,
  TransactionCardData,
  TransactionsResponse,
  TransactionStatus,
  ShippingCarrier,
} from '@/types/marketplace'
import { MARKETPLACE_PAGINATION } from '@/lib/config/marketplace-constants'

// =====================================================
// TRANSACTION QUERIES
// =====================================================

/**
 * Create a transaction from an accepted offer
 * Uses RPC function to ensure offer is in accepted state
 */
export async function createTransaction(
  params: {
    offerId: string
    amountCents: number
    shippingCents: number
    platformFeeCents: number
    stripeFeeCents: number
    sellerPayoutCents: number
  }
): Promise<MarketplaceTransaction> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .rpc('create_transaction_from_offer', {
      p_offer_id: params.offerId,
      p_amount_cents: params.amountCents,
      p_shipping_cents: params.shippingCents,
      p_platform_fee_cents: params.platformFeeCents,
      p_stripe_fee_cents: params.stripeFeeCents,
      p_seller_payout_cents: params.sellerPayoutCents,
    })

  if (error) {
    console.error('Error creating transaction:', error)
    throw error
  }

  return data as MarketplaceTransaction
}

/**
 * Get a single transaction by ID with full details
 */
export async function getTransactionById(
  transactionId: string
): Promise<TransactionWithDetails | null> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('marketplace_transactions')
    .select(`
      *,
      offer:marketplace_offers(
        id,
        offer_type,
        amount_cents,
        trade_game_ids
      ),
      listing:marketplace_listings(
        id,
        listing_type,
        title,
        status,
        game:games(
          id,
          name,
          slug,
          thumbnail_url,
          box_image_url
        )
      ),
      buyer:user_profiles!marketplace_transactions_buyer_id_fkey(
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      ),
      seller:user_profiles!marketplace_transactions_seller_id_fkey(
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      )
    `)
    .eq('id', transactionId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching transaction:', error)
    throw error
  }

  return data as TransactionWithDetails | null
}

/**
 * Get a transaction by offer ID
 */
export async function getTransactionByOfferId(
  offerId: string
): Promise<MarketplaceTransaction | null> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('marketplace_transactions')
    .select('*')
    .eq('offer_id', offerId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching transaction by offer:', error)
    throw error
  }

  return data as MarketplaceTransaction | null
}

/**
 * Get a transaction by Stripe payment intent ID
 */
export async function getTransactionByPaymentIntent(
  paymentIntentId: string
): Promise<MarketplaceTransaction | null> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('marketplace_transactions')
    .select('*')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching transaction by payment intent:', error)
    throw error
  }

  return data as MarketplaceTransaction | null
}

/**
 * Get a transaction by Stripe checkout session ID
 */
export async function getTransactionByCheckoutSession(
  sessionId: string
): Promise<MarketplaceTransaction | null> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('marketplace_transactions')
    .select('*')
    .eq('stripe_checkout_session_id', sessionId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching transaction by checkout session:', error)
    throw error
  }

  return data as MarketplaceTransaction | null
}

/**
 * Get transactions for a user (as buyer or seller)
 */
export async function getTransactionsByUser(
  userId: string,
  role: 'buyer' | 'seller',
  filters: { status?: TransactionStatus; limit?: number; offset?: number } = {}
): Promise<TransactionsResponse> {
  const supabase = createClient()
  const limit = filters.limit || MARKETPLACE_PAGINATION.TRANSACTIONS_PAGE_SIZE
  const offset = filters.offset || 0

  const roleColumn = role === 'buyer' ? 'buyer_id' : 'seller_id'
  const otherRoleColumn = role === 'buyer' ? 'seller_id' : 'buyer_id'

  let query = (supabase as any)
    .from('marketplace_transactions')
    .select(`
      id,
      status,
      amount_cents,
      shipping_cents,
      currency,
      created_at,
      paid_at,
      shipped_at,
      delivered_at,
      tracking_number,
      shipping_carrier,
      listing_id,
      listing:marketplace_listings(
        game:games(
          name,
          slug,
          thumbnail_url
        )
      ),
      other_user:user_profiles!marketplace_transactions_${otherRoleColumn}_fkey(
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      )
    `, { count: 'exact' })
    .eq(roleColumn, userId)

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching user transactions:', error)
    throw error
  }

  const transactions: TransactionCardData[] = (data || []).map((item: Record<string, unknown>) => {
    const otherUser = item.other_user as Record<string, unknown>
    const listing = item.listing as Record<string, unknown>
    const game = listing?.game as Record<string, unknown>

    return {
      id: item.id as string,
      status: item.status as TransactionStatus,
      amount_cents: item.amount_cents as number,
      shipping_cents: item.shipping_cents as number,
      currency: item.currency as string,
      created_at: item.created_at as string,
      paid_at: item.paid_at as string | null,
      shipped_at: item.shipped_at as string | null,
      delivered_at: item.delivered_at as string | null,
      tracking_number: item.tracking_number as string | null,
      shipping_carrier: item.shipping_carrier as ShippingCarrier | null,
      listing_id: item.listing_id as string,
      game_name: game?.name as string,
      game_slug: game?.slug as string,
      game_image: game?.thumbnail_url as string | null,
      other_user_id: otherUser?.id as string,
      other_user_username: otherUser?.username as string | null,
      other_user_display_name: otherUser?.display_name as string | null,
      other_user_avatar: (otherUser?.custom_avatar_url || otherUser?.avatar_url) as string | null,
      role,
    }
  })

  return {
    transactions,
    total: count || 0,
    hasMore: offset + limit < (count || 0),
  }
}

// =====================================================
// TRANSACTION UPDATES
// =====================================================

/**
 * Update transaction fields
 */
export async function updateTransaction(
  transactionId: string,
  update: MarketplaceTransactionUpdate
): Promise<MarketplaceTransaction> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('marketplace_transactions')
    .update({
      ...update,
      updated_at: new Date().toISOString(),
    })
    .eq('id', transactionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating transaction:', error)
    throw error
  }

  return data as MarketplaceTransaction
}

/**
 * Update checkout session ID on a transaction
 */
export async function setCheckoutSessionId(
  transactionId: string,
  sessionId: string
): Promise<MarketplaceTransaction> {
  return updateTransaction(transactionId, {
    stripe_checkout_session_id: sessionId,
  })
}

// =====================================================
// TRANSACTION ACTIONS (via RPC functions)
// =====================================================

/**
 * Mark transaction as paid (called after Stripe confirms payment)
 */
export async function markTransactionPaid(
  transactionId: string,
  paymentIntentId: string,
  chargeId?: string
): Promise<MarketplaceTransaction> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .rpc('mark_transaction_paid', {
      p_transaction_id: transactionId,
      p_payment_intent_id: paymentIntentId,
      p_charge_id: chargeId || null,
    })

  if (error) {
    console.error('Error marking transaction paid:', error)
    throw error
  }

  return data as MarketplaceTransaction
}

/**
 * Ship transaction (seller action)
 */
export async function shipTransaction(
  transactionId: string,
  userId: string,
  carrier: ShippingCarrier,
  trackingNumber?: string
): Promise<MarketplaceTransaction> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .rpc('ship_transaction', {
      p_transaction_id: transactionId,
      p_user_id: userId,
      p_carrier: carrier,
      p_tracking_number: trackingNumber || null,
    })

  if (error) {
    console.error('Error shipping transaction:', error)
    throw error
  }

  return data as MarketplaceTransaction
}

/**
 * Confirm delivery (buyer action)
 */
export async function confirmDelivery(
  transactionId: string,
  userId: string
): Promise<MarketplaceTransaction> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .rpc('confirm_delivery', {
      p_transaction_id: transactionId,
      p_user_id: userId,
    })

  if (error) {
    console.error('Error confirming delivery:', error)
    throw error
  }

  return data as MarketplaceTransaction
}

/**
 * Release funds (complete transaction)
 */
export async function releaseFunds(
  transactionId: string,
  transferId?: string
): Promise<MarketplaceTransaction> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .rpc('release_transaction_funds', {
      p_transaction_id: transactionId,
      p_transfer_id: transferId || null,
    })

  if (error) {
    console.error('Error releasing funds:', error)
    throw error
  }

  return data as MarketplaceTransaction
}

/**
 * Request refund (buyer action)
 */
export async function requestRefund(
  transactionId: string,
  userId: string,
  reason?: string
): Promise<MarketplaceTransaction> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .rpc('request_refund', {
      p_transaction_id: transactionId,
      p_user_id: userId,
      p_reason: reason || null,
    })

  if (error) {
    console.error('Error requesting refund:', error)
    throw error
  }

  return data as MarketplaceTransaction
}

// =====================================================
// TRANSACTION STATS
// =====================================================

/**
 * Get transaction statistics for a user
 */
export async function getUserTransactionStats(userId: string): Promise<{
  asBuyerPending: number
  asBuyerActive: number
  asBuyerCompleted: number
  asSellerPending: number
  asSellerActive: number
  asSellerCompleted: number
  totalSpentCents: number
  totalEarnedCents: number
}> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .rpc('get_user_transaction_stats', {
      p_user_id: userId,
    })

  if (error) {
    console.error('Error fetching user transaction stats:', error)
    return {
      asBuyerPending: 0,
      asBuyerActive: 0,
      asBuyerCompleted: 0,
      asSellerPending: 0,
      asSellerActive: 0,
      asSellerCompleted: 0,
      totalSpentCents: 0,
      totalEarnedCents: 0,
    }
  }

  // RPC returns a single row
  const row = Array.isArray(data) ? data[0] : data

  return {
    asBuyerPending: row?.as_buyer_pending || 0,
    asBuyerActive: row?.as_buyer_active || 0,
    asBuyerCompleted: row?.as_buyer_completed || 0,
    asSellerPending: row?.as_seller_pending || 0,
    asSellerActive: row?.as_seller_active || 0,
    asSellerCompleted: row?.as_seller_completed || 0,
    totalSpentCents: row?.total_spent_cents || 0,
    totalEarnedCents: row?.total_earned_cents || 0,
  }
}

/**
 * Get count of transactions requiring action for a user
 */
export async function getActionRequiredCount(
  userId: string
): Promise<{ asBuyer: number; asSeller: number }> {
  const supabase = createClient()

  // Buyer: pending payment
  const { count: buyerCount, error: buyerError } = await (supabase as any)
    .from('marketplace_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('buyer_id', userId)
    .eq('status', 'pending_payment')

  // Seller: payment held (needs to ship)
  const { count: sellerCount, error: sellerError } = await (supabase as any)
    .from('marketplace_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', userId)
    .eq('status', 'payment_held')

  if (buyerError) {
    console.error('Error fetching buyer action count:', buyerError)
  }
  if (sellerError) {
    console.error('Error fetching seller action count:', sellerError)
  }

  return {
    asBuyer: buyerCount || 0,
    asSeller: sellerCount || 0,
  }
}

// =====================================================
// STRIPE CONNECT HELPERS
// =====================================================

/**
 * Get user's marketplace settings including Stripe Connect status
 */
export async function getUserMarketplaceSettings(userId: string): Promise<{
  stripeAccountId: string | null
  stripeAccountStatus: string | null
  stripeOnboardingComplete: boolean
  stripeChargesEnabled: boolean
  stripePayoutsEnabled: boolean
} | null> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('user_marketplace_settings')
    .select(`
      stripe_account_id,
      stripe_account_status,
      stripe_onboarding_complete,
      stripe_charges_enabled,
      stripe_payouts_enabled
    `)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching marketplace settings:', error)
    return null
  }

  if (!data) return null

  return {
    stripeAccountId: data.stripe_account_id,
    stripeAccountStatus: data.stripe_account_status,
    stripeOnboardingComplete: data.stripe_onboarding_complete,
    stripeChargesEnabled: data.stripe_charges_enabled,
    stripePayoutsEnabled: data.stripe_payouts_enabled,
  }
}

/**
 * Update user's Stripe Connect info
 */
export async function updateStripeConnectInfo(
  userId: string,
  info: {
    stripeAccountId?: string
    stripeAccountStatus?: string
    stripeOnboardingComplete?: boolean
    stripeChargesEnabled?: boolean
    stripePayoutsEnabled?: boolean
  }
): Promise<void> {
  const supabase = createClient()

  // Upsert marketplace settings
  const { error } = await (supabase as any)
    .from('user_marketplace_settings')
    .upsert({
      user_id: userId,
      stripe_account_id: info.stripeAccountId,
      stripe_account_status: info.stripeAccountStatus,
      stripe_onboarding_complete: info.stripeOnboardingComplete,
      stripe_charges_enabled: info.stripeChargesEnabled,
      stripe_payouts_enabled: info.stripePayoutsEnabled,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })

  if (error) {
    console.error('Error updating Stripe Connect info:', error)
    throw error
  }
}
