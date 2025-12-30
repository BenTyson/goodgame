/**
 * Marketplace Offer Queries
 *
 * CRUD operations for marketplace offers (buy, trade, negotiate).
 *
 * NOTE: This file uses type casting (`as any`) to bypass TypeScript errors
 * until database types are regenerated after running migrations.
 * Run: npx supabase gen types typescript --local > src/types/supabase.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from './client'
import type {
  MarketplaceOffer,
  MarketplaceOfferInsert,
  OfferWithDetails,
  OfferCardData,
  OffersResponse,
  OfferStatus,
  OfferType,
} from '@/types/marketplace'
import { MARKETPLACE_PAGINATION, OFFER_SETTINGS } from '@/lib/config/marketplace-constants'

// =====================================================
// OFFER QUERIES
// =====================================================

/**
 * Create a new offer on a listing
 */
export async function createOffer(
  offer: MarketplaceOfferInsert
): Promise<MarketplaceOffer> {
  const supabase = createClient()

  // Calculate expiration time
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + OFFER_SETTINGS.DEFAULT_EXPIRY_HOURS)

  const { data, error } = await (supabase as any)
    .from('marketplace_offers')
    .insert({
      ...offer,
      expires_at: offer.expires_at || expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating offer:', error)
    throw error
  }

  return data as MarketplaceOffer
}

/**
 * Get a single offer by ID with full details
 */
export async function getOfferById(
  offerId: string
): Promise<OfferWithDetails | null> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('marketplace_offers')
    .select(`
      *,
      buyer:user_profiles!marketplace_offers_buyer_id_fkey(
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      ),
      seller:user_profiles!marketplace_offers_seller_id_fkey(
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      ),
      listing:marketplace_listings(
        id,
        listing_type,
        price_cents,
        currency,
        status,
        game:games(
          id,
          name,
          slug,
          thumbnail_url
        )
      )
    `)
    .eq('id', offerId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching offer:', error)
    throw error
  }

  if (!data) return null

  // Fetch trade games if any
  let tradeGames = undefined
  if (data.trade_game_ids && data.trade_game_ids.length > 0) {
    const { data: games } = await (supabase as any)
      .from('games')
      .select('id, name, slug, thumbnail_url')
      .in('id', data.trade_game_ids)

    tradeGames = games || []
  }

  return {
    ...data,
    trade_games: tradeGames,
  } as OfferWithDetails
}

/**
 * Get all offers for a listing (seller view)
 */
export async function getOffersForListing(
  listingId: string,
  status?: OfferStatus
): Promise<OfferCardData[]> {
  const supabase = createClient()

  let query = (supabase as any)
    .from('marketplace_offers')
    .select(`
      id,
      listing_id,
      buyer_id,
      seller_id,
      offer_type,
      amount_cents,
      currency,
      trade_game_ids,
      status,
      message,
      expires_at,
      created_at,
      counter_count,
      buyer:user_profiles!marketplace_offers_buyer_id_fkey(
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      ),
      listing:marketplace_listings(
        price_cents,
        game:games(
          name,
          slug,
          thumbnail_url
        )
      )
    `)
    .eq('listing_id', listingId)

  if (status) {
    query = query.eq('status', status)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching listing offers:', error)
    throw error
  }

  return (data || []).map((item: Record<string, unknown>) => {
    const buyer = item.buyer as Record<string, unknown>
    const listing = item.listing as Record<string, unknown>
    const game = listing?.game as Record<string, unknown>
    const tradeGameIds = item.trade_game_ids as string[] | null

    return {
      id: item.id as string,
      listing_id: item.listing_id as string,
      offer_type: item.offer_type as OfferType,
      amount_cents: item.amount_cents as number | null,
      currency: item.currency as string,
      status: item.status as OfferStatus,
      message: item.message as string | null,
      expires_at: item.expires_at as string,
      created_at: item.created_at as string,
      counter_count: item.counter_count as number,
      trade_game_count: tradeGameIds?.length || 0,
      game_name: game?.name as string,
      game_slug: game?.slug as string,
      game_image: game?.thumbnail_url as string | null,
      listing_price_cents: listing?.price_cents as number | null,
      other_user_id: buyer.id as string,
      other_user_username: buyer.username as string | null,
      other_user_display_name: buyer.display_name as string | null,
      other_user_avatar: (buyer.custom_avatar_url || buyer.avatar_url) as string | null,
    }
  })
}

/**
 * Get offers by user (as buyer or seller)
 */
export async function getOffersByUser(
  userId: string,
  role: 'buyer' | 'seller',
  filters: { status?: OfferStatus; limit?: number; offset?: number } = {}
): Promise<OffersResponse> {
  const supabase = createClient()
  const limit = filters.limit || MARKETPLACE_PAGINATION.OFFERS_PAGE_SIZE
  const offset = filters.offset || 0

  const roleColumn = role === 'buyer' ? 'buyer_id' : 'seller_id'
  const otherRoleColumn = role === 'buyer' ? 'seller_id' : 'buyer_id'

  let query = (supabase as any)
    .from('marketplace_offers')
    .select(`
      id,
      listing_id,
      buyer_id,
      seller_id,
      offer_type,
      amount_cents,
      currency,
      trade_game_ids,
      status,
      message,
      expires_at,
      created_at,
      counter_count,
      other_user:user_profiles!marketplace_offers_${otherRoleColumn}_fkey(
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      ),
      listing:marketplace_listings(
        price_cents,
        game:games(
          name,
          slug,
          thumbnail_url
        )
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
    console.error('Error fetching user offers:', error)
    throw error
  }

  const offers: OfferCardData[] = (data || []).map((item: Record<string, unknown>) => {
    const otherUser = item.other_user as Record<string, unknown>
    const listing = item.listing as Record<string, unknown>
    const game = listing?.game as Record<string, unknown>
    const tradeGameIds = item.trade_game_ids as string[] | null

    return {
      id: item.id as string,
      listing_id: item.listing_id as string,
      offer_type: item.offer_type as OfferType,
      amount_cents: item.amount_cents as number | null,
      currency: item.currency as string,
      status: item.status as OfferStatus,
      message: item.message as string | null,
      expires_at: item.expires_at as string,
      created_at: item.created_at as string,
      counter_count: item.counter_count as number,
      trade_game_count: tradeGameIds?.length || 0,
      game_name: game?.name as string,
      game_slug: game?.slug as string,
      game_image: game?.thumbnail_url as string | null,
      listing_price_cents: listing?.price_cents as number | null,
      other_user_id: otherUser?.id as string,
      other_user_username: otherUser?.username as string | null,
      other_user_display_name: otherUser?.display_name as string | null,
      other_user_avatar: (otherUser?.custom_avatar_url || otherUser?.avatar_url) as string | null,
    }
  })

  return {
    offers,
    total: count || 0,
    hasMore: offset + limit < (count || 0),
  }
}

// =====================================================
// OFFER ACTIONS (via RPC functions)
// =====================================================

/**
 * Accept an offer (seller action)
 */
export async function acceptOffer(
  offerId: string,
  userId: string,
  message?: string
): Promise<MarketplaceOffer> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .rpc('accept_offer', {
      p_offer_id: offerId,
      p_user_id: userId,
      p_message: message || null,
    })

  if (error) {
    console.error('Error accepting offer:', error)
    throw error
  }

  return data as MarketplaceOffer
}

/**
 * Decline an offer (seller action)
 */
export async function declineOffer(
  offerId: string,
  userId: string,
  message?: string
): Promise<MarketplaceOffer> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .rpc('decline_offer', {
      p_offer_id: offerId,
      p_user_id: userId,
      p_message: message || null,
    })

  if (error) {
    console.error('Error declining offer:', error)
    throw error
  }

  return data as MarketplaceOffer
}

/**
 * Counter an offer (seller action, creates new offer)
 */
export async function counterOffer(
  offerId: string,
  userId: string,
  amountCents?: number,
  tradeGameIds?: string[],
  message?: string
): Promise<MarketplaceOffer> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .rpc('counter_offer', {
      p_offer_id: offerId,
      p_user_id: userId,
      p_amount_cents: amountCents || null,
      p_trade_game_ids: tradeGameIds || null,
      p_message: message || null,
    })

  if (error) {
    console.error('Error countering offer:', error)
    throw error
  }

  return data as MarketplaceOffer
}

/**
 * Withdraw an offer (buyer action)
 */
export async function withdrawOffer(
  offerId: string,
  userId: string
): Promise<MarketplaceOffer> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .rpc('withdraw_offer', {
      p_offer_id: offerId,
      p_user_id: userId,
    })

  if (error) {
    console.error('Error withdrawing offer:', error)
    throw error
  }

  return data as MarketplaceOffer
}

// =====================================================
// OFFER STATS
// =====================================================

/**
 * Get offer statistics for a listing
 */
export async function getListingOfferStats(
  listingId: string
): Promise<{ totalOffers: number; pendingOffers: number; highestOfferCents: number | null }> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .rpc('get_listing_offer_counts', {
      p_listing_id: listingId,
    })

  if (error) {
    console.error('Error fetching listing offer stats:', error)
    return { totalOffers: 0, pendingOffers: 0, highestOfferCents: null }
  }

  // RPC returns a single row
  const row = Array.isArray(data) ? data[0] : data

  return {
    totalOffers: row?.total_offers || 0,
    pendingOffers: row?.pending_offers || 0,
    highestOfferCents: row?.highest_offer_cents || null,
  }
}

/**
 * Get pending offer count for a user (for badges)
 */
export async function getPendingOfferCount(
  userId: string,
  role: 'buyer' | 'seller'
): Promise<number> {
  const supabase = createClient()
  const roleColumn = role === 'buyer' ? 'buyer_id' : 'seller_id'

  const { count, error } = await (supabase as any)
    .from('marketplace_offers')
    .select('*', { count: 'exact', head: true })
    .eq(roleColumn, userId)
    .eq('status', 'pending')

  if (error) {
    console.error('Error fetching pending offer count:', error)
    return 0
  }

  return count || 0
}

/**
 * Check if user has pending offer on listing
 */
export async function hasPendingOffer(
  userId: string,
  listingId: string
): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('marketplace_offers')
    .select('id')
    .eq('buyer_id', userId)
    .eq('listing_id', listingId)
    .eq('status', 'pending')
    .maybeSingle()

  if (error) {
    console.error('Error checking pending offer:', error)
    return false
  }

  return !!data
}

// =====================================================
// COUNTER-OFFER CHAIN
// =====================================================

/**
 * Get the offer chain (original offer + all counter-offers)
 */
export async function getOfferChain(
  offerId: string
): Promise<MarketplaceOffer[]> {
  const supabase = createClient()

  // First, find the root offer (walk up parent_offer_id chain)
  let currentId = offerId
  let rootId = offerId

  while (true) {
    const { data } = await (supabase as any)
      .from('marketplace_offers')
      .select('id, parent_offer_id')
      .eq('id', currentId)
      .maybeSingle()

    if (!data || !data.parent_offer_id) {
      rootId = currentId
      break
    }
    currentId = data.parent_offer_id
  }

  // Now get all offers in the chain (root + descendants)
  const chain: MarketplaceOffer[] = []
  const toProcess = [rootId]
  const processed = new Set<string>()

  while (toProcess.length > 0) {
    const id = toProcess.shift()!
    if (processed.has(id)) continue
    processed.add(id)

    const { data } = await (supabase as any)
      .from('marketplace_offers')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (data) {
      chain.push(data as MarketplaceOffer)

      // Find children
      const { data: children } = await (supabase as any)
        .from('marketplace_offers')
        .select('id')
        .eq('parent_offer_id', id)

      if (children) {
        for (const child of children) {
          toProcess.push(child.id)
        }
      }
    }
  }

  // Sort by created_at
  chain.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return chain
}
