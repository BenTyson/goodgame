/**
 * Seller Dashboard Queries
 *
 * Consolidated queries for the seller dashboard.
 * Re-exports useful functions from other query files and adds dashboard-specific logic.
 */

import { createClient } from './server'
import { getSellerListingStats, getSellerListings, getUserMarketplaceSettings } from './listing-queries'
import { getOffersByUser, getPendingOfferCount } from './offer-queries'
import { getTransactionsByUser, getActionRequiredCount, getUserTransactionStats } from './transaction-queries'
import { getUserConversations, getUnreadMessageCount } from './conversation-queries'
import { getUserReputation } from './feedback-queries'
import type {
  SellerDashboardData,
  SellerDashboardStats,
  DashboardStripeStatus,
  ActionRequiredItem,
  OfferCardData,
  TransactionCardData,
  ListingCardData,
  TrustLevel,
} from '@/types/marketplace'

// Re-export commonly used functions for convenience
export {
  getSellerListingStats,
  getSellerListings,
  getOffersByUser,
  getPendingOfferCount,
  getTransactionsByUser,
  getActionRequiredCount,
  getUserTransactionStats,
  getUserConversations,
  getUnreadMessageCount,
  getUserReputation,
}

/**
 * Get Stripe onboarding status for dashboard
 */
export async function getDashboardStripeStatus(userId: string): Promise<DashboardStripeStatus> {
  const settings = await getUserMarketplaceSettings(userId)

  if (!settings) {
    return {
      connected: false,
      onboardingComplete: false,
      chargesEnabled: false,
      payoutsEnabled: false,
      requiresAction: true,
    }
  }

  return {
    connected: !!settings.stripe_account_id,
    onboardingComplete: settings.stripe_onboarding_complete,
    chargesEnabled: settings.stripe_charges_enabled,
    payoutsEnabled: settings.stripe_payouts_enabled,
    requiresAction: !settings.stripe_onboarding_complete || !settings.stripe_charges_enabled,
  }
}

/**
 * Build action required items for dashboard
 */
export async function getActionRequiredItems(userId: string): Promise<ActionRequiredItem[]> {
  const items: ActionRequiredItem[] = []
  const supabase = await createClient()

  // 1. Pending offers (high urgency)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pendingOffers } = await (supabase as any)
    .from('marketplace_offers')
    .select(`
      id,
      amount_cents,
      expires_at,
      created_at,
      listing:marketplace_listings!inner(
        id,
        game:games(name, thumbnail_url)
      ),
      buyer:user_profiles!marketplace_offers_buyer_id_fkey(
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      )
    `)
    .eq('seller_id', userId)
    .eq('status', 'pending')
    .order('expires_at', { ascending: true })
    .limit(5)

  if (pendingOffers) {
    for (const offer of pendingOffers) {
      const game = offer.listing?.game
      const buyer = offer.buyer
      items.push({
        type: 'offer_pending',
        id: `offer-${offer.id}`,
        title: `Offer on ${game?.name || 'Unknown Game'}`,
        subtitle: `From @${buyer?.username || buyer?.display_name || 'Unknown'}`,
        urgency: 'high',
        expiresAt: offer.expires_at,
        ctaLabel: 'Respond',
        ctaHref: `/marketplace/offers`,
        offerId: offer.id,
        listingId: offer.listing?.id,
        gameImage: game?.thumbnail_url,
        otherUserName: buyer?.display_name || buyer?.username,
        otherUserAvatar: buyer?.custom_avatar_url || buyer?.avatar_url,
        amountCents: offer.amount_cents,
      })
    }
  }

  // 2. Transactions needing shipping (high urgency)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: needsShipping } = await (supabase as any)
    .from('marketplace_transactions')
    .select(`
      id,
      amount_cents,
      created_at,
      listing:marketplace_listings!inner(
        id,
        game:games(name, thumbnail_url)
      ),
      buyer:user_profiles!marketplace_transactions_buyer_id_fkey(
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      )
    `)
    .eq('seller_id', userId)
    .eq('status', 'payment_held')
    .order('created_at', { ascending: true })
    .limit(5)

  if (needsShipping) {
    for (const tx of needsShipping) {
      const game = tx.listing?.game
      const buyer = tx.buyer
      items.push({
        type: 'transaction_ship',
        id: `ship-${tx.id}`,
        title: `Ship ${game?.name || 'Unknown Game'}`,
        subtitle: `To @${buyer?.username || buyer?.display_name || 'Unknown'}`,
        urgency: 'high',
        ctaLabel: 'Add Tracking',
        ctaHref: `/marketplace/transactions/${tx.id}`,
        transactionId: tx.id,
        listingId: tx.listing?.id,
        gameImage: game?.thumbnail_url,
        otherUserName: buyer?.display_name || buyer?.username,
        otherUserAvatar: buyer?.custom_avatar_url || buyer?.avatar_url,
        amountCents: tx.amount_cents,
      })
    }
  }

  // 3. Feedback to leave (medium urgency)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: needsFeedback } = await (supabase as any)
    .from('marketplace_transactions')
    .select(`
      id,
      created_at,
      listing:marketplace_listings!inner(
        id,
        game:games(name, thumbnail_url)
      ),
      buyer:user_profiles!marketplace_transactions_buyer_id_fkey(
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      )
    `)
    .eq('seller_id', userId)
    .eq('status', 'completed')
    .is('released_at', null) // Not yet fully closed
    .order('created_at', { ascending: true })
    .limit(3)

  // Check if feedback already left for these transactions
  if (needsFeedback && needsFeedback.length > 0) {
    const txIds = needsFeedback.map((tx: { id: string }) => tx.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingFeedback } = await (supabase as any)
      .from('marketplace_feedback')
      .select('transaction_id')
      .eq('reviewer_id', userId)
      .in('transaction_id', txIds)

    const feedbackTxIds = new Set(existingFeedback?.map((f: { transaction_id: string }) => f.transaction_id) || [])

    for (const tx of needsFeedback) {
      if (!feedbackTxIds.has(tx.id)) {
        const game = tx.listing?.game
        const buyer = tx.buyer
        items.push({
          type: 'feedback_pending',
          id: `feedback-${tx.id}`,
          title: `Leave feedback for ${game?.name || 'transaction'}`,
          subtitle: `Rate your transaction with @${buyer?.username || buyer?.display_name || 'Unknown'}`,
          urgency: 'medium',
          ctaLabel: 'Leave Feedback',
          ctaHref: `/marketplace/transactions/${tx.id}`,
          transactionId: tx.id,
          gameImage: game?.thumbnail_url,
          otherUserName: buyer?.display_name || buyer?.username,
          otherUserAvatar: buyer?.custom_avatar_url || buyer?.avatar_url,
        })
      }
    }
  }

  // 4. Expiring listings (low urgency - within 7 days)
  const sevenDaysFromNow = new Date()
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: expiringListings } = await (supabase as any)
    .from('marketplace_listings')
    .select(`
      id,
      expires_at,
      game:games(name, thumbnail_url)
    `)
    .eq('seller_id', userId)
    .eq('status', 'active')
    .not('expires_at', 'is', null)
    .lte('expires_at', sevenDaysFromNow.toISOString())
    .order('expires_at', { ascending: true })
    .limit(3)

  if (expiringListings) {
    for (const listing of expiringListings) {
      const game = listing.game
      items.push({
        type: 'listing_expiring',
        id: `expiring-${listing.id}`,
        title: `${game?.name || 'Listing'} expiring soon`,
        subtitle: 'Consider renewing to keep it active',
        urgency: 'low',
        expiresAt: listing.expires_at,
        ctaLabel: 'Renew',
        ctaHref: `/marketplace/listings/${listing.id}/edit`,
        listingId: listing.id,
        gameImage: game?.thumbnail_url,
      })
    }
  }

  // Sort by urgency (high first)
  const urgencyOrder = { high: 0, medium: 1, low: 2 }
  items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])

  return items
}

/**
 * Safely get user reputation (returns null on error)
 */
async function getSafeUserReputation(userId: string) {
  try {
    return await getUserReputation(userId)
  } catch {
    // RPC function may not exist in all environments
    return null
  }
}

/**
 * Get complete seller dashboard data in one call
 */
export async function getSellerDashboardData(userId: string): Promise<SellerDashboardData> {
  // Fetch all data in parallel
  const [
    listingStats,
    pendingOfferCount,
    actionRequiredCounts,
    unreadMessages,
    reputation,
    transactionStats,
    stripeStatus,
    actionItems,
    offersResponse,
    transactionsResponse,
    listings,
  ] = await Promise.all([
    getSellerListingStats(userId),
    getPendingOfferCount(userId, 'seller'),
    getActionRequiredCount(userId),
    getUnreadMessageCount(userId),
    getSafeUserReputation(userId),
    getUserTransactionStats(userId),
    getDashboardStripeStatus(userId),
    getActionRequiredItems(userId),
    getOffersByUser(userId, 'seller', { limit: 10, status: 'pending' }),
    getTransactionsByUser(userId, 'seller', { limit: 10 }),
    getSellerListings(userId),
  ])

  // Build stats
  const stats: SellerDashboardStats = {
    activeListings: listingStats.active || 0,
    pendingOffers: pendingOfferCount,
    actionRequired: actionRequiredCounts.asSeller + actionItems.length,
    unreadMessages: unreadMessages,
    totalEarningsCents: transactionStats.totalEarnedCents || 0,
    rating: reputation?.seller_rating || null,
    feedbackCount: reputation?.seller_feedback_count || 0,
    trustLevel: (reputation?.trust_level as TrustLevel) || 'new',
    totalSales: reputation?.total_sales || 0,
  }

  return {
    stats,
    stripeStatus,
    actionItems,
    recentOffers: offersResponse.offers as OfferCardData[],
    recentTransactions: transactionsResponse.transactions as TransactionCardData[],
    listings: listings as ListingCardData[],
  }
}
