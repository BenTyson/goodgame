/**
 * Marketplace Listing Queries
 *
 * CRUD operations for marketplace listings, images, and saves.
 *
 * NOTE: This file uses type casting (`as any`) to bypass TypeScript errors
 * until database types are regenerated after running migrations.
 * Run: npx supabase gen types typescript --local > src/types/supabase.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from './client'
import type {
  MarketplaceListing,
  MarketplaceListingInsert,
  MarketplaceListingUpdate,
  ListingImage,
  ListingImageInsert,
  ListingWithDetails,
  ListingCardData,
  ListingFilters,
  ListingsResponse,
  UserMarketplaceSettings,
} from '@/types/marketplace'
import { MARKETPLACE_PAGINATION } from '@/lib/config/marketplace-constants'

// =====================================================
// LISTING QUERIES
// =====================================================

/**
 * Get listings with filters for browse page
 */
export async function getListings(
  filters: ListingFilters = {}
): Promise<ListingsResponse> {
  const supabase = createClient()
  const limit = filters.limit || MARKETPLACE_PAGINATION.LISTINGS_PAGE_SIZE
  const offset = filters.offset || 0

  let query = (supabase as any)
    .from('marketplace_listings')
    .select(`
      id,
      listing_type,
      status,
      condition,
      price_cents,
      currency,
      shipping_cost_cents,
      shipping_preference,
      location_city,
      location_state,
      expires_at,
      created_at,
      game:games!inner(
        id,
        name,
        slug,
        box_image_url,
        thumbnail_url
      ),
      seller:user_profiles!inner(
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      ),
      images:listing_images(
        url,
        is_primary
      )
    `, { count: 'exact' })
    .eq('status', 'active')

  // Apply filters
  if (filters.listing_types && filters.listing_types.length > 0) {
    query = query.in('listing_type', filters.listing_types)
  }

  if (filters.conditions && filters.conditions.length > 0) {
    query = query.in('condition', filters.conditions)
  }

  if (filters.price_min_cents !== undefined) {
    query = query.gte('price_cents', filters.price_min_cents)
  }

  if (filters.price_max_cents !== undefined) {
    query = query.lte('price_cents', filters.price_max_cents)
  }

  if (filters.shipping_preferences && filters.shipping_preferences.length > 0) {
    query = query.in('shipping_preference', filters.shipping_preferences)
  }

  if (filters.game_ids && filters.game_ids.length > 0) {
    query = query.in('game_id', filters.game_ids)
  }

  if (filters.seller_id) {
    query = query.eq('seller_id', filters.seller_id)
  }

  // Full-text search
  if (filters.query) {
    query = query.textSearch('fts', filters.query)
  }

  // Sorting
  switch (filters.sort_by) {
    case 'price_low':
      query = query.order('price_cents', { ascending: true, nullsFirst: false })
      break
    case 'price_high':
      query = query.order('price_cents', { ascending: false, nullsFirst: false })
      break
    case 'ending_soon':
      query = query.order('expires_at', { ascending: true, nullsFirst: false })
      break
    case 'newest':
    default:
      query = query.order('published_at', { ascending: false })
  }

  // Pagination
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching listings:', error)
    throw error
  }

  // Transform to ListingCardData
  const listings: ListingCardData[] = (data || []).map((item: Record<string, unknown>) => {
    const game = item.game as Record<string, unknown>
    const seller = item.seller as Record<string, unknown>
    const images = item.images as Array<{ url: string; is_primary: boolean }> | null
    const primaryImage = images?.find(img => img.is_primary)?.url || null

    return {
      id: item.id as string,
      listing_type: item.listing_type as ListingCardData['listing_type'],
      status: item.status as ListingCardData['status'],
      condition: item.condition as ListingCardData['condition'],
      price_cents: item.price_cents as number | null,
      currency: item.currency as string,
      shipping_cost_cents: item.shipping_cost_cents as number | null,
      shipping_preference: item.shipping_preference as ListingCardData['shipping_preference'],
      location_city: item.location_city as string | null,
      location_state: item.location_state as string | null,
      expires_at: item.expires_at as string | null,
      created_at: item.created_at as string,
      game_id: game.id as string,
      game_name: game.name as string,
      game_slug: game.slug as string,
      game_image: (game.box_image_url || game.thumbnail_url) as string | null,
      seller_id: seller.id as string,
      seller_username: seller.username as string | null,
      seller_display_name: seller.display_name as string | null,
      seller_avatar: (seller.custom_avatar_url || seller.avatar_url) as string | null,
      seller_rating: null, // TODO: Join with marketplace_settings
      seller_sales_count: 0, // TODO: Join with marketplace_settings
      primary_image_url: primaryImage,
    }
  })

  return {
    listings,
    total: count || 0,
    hasMore: offset + limit < (count || 0),
  }
}

/**
 * Get a single listing by ID with full details
 */
export async function getListingById(
  listingId: string
): Promise<ListingWithDetails | null> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('marketplace_listings')
    .select(`
      *,
      game:games(
        id,
        name,
        slug,
        box_image_url,
        thumbnail_url,
        player_count_min,
        player_count_max,
        play_time_min,
        play_time_max
      ),
      seller:user_profiles(
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      ),
      images:listing_images(*)
    `)
    .eq('id', listingId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching listing:', error)
    throw error
  }

  if (!data) return null

  // Get seller marketplace settings for rating
  const { data: sellerSettings } = await (supabase as any)
    .from('user_marketplace_settings')
    .select('seller_rating, total_sales')
    .eq('user_id', data.seller.id)
    .maybeSingle()

  // Increment view count
  await (supabase as any)
    .from('marketplace_listings')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', listingId)

  return {
    ...data,
    seller_rating: sellerSettings?.seller_rating || null,
    seller_sales_count: sellerSettings?.total_sales || 0,
  } as ListingWithDetails
}

/**
 * Get listings by seller (for dashboard)
 */
export async function getSellerListings(
  sellerId: string,
  status?: MarketplaceListing['status']
): Promise<ListingCardData[]> {
  const supabase = createClient()

  let query = (supabase as any)
    .from('marketplace_listings')
    .select(`
      id,
      listing_type,
      status,
      condition,
      price_cents,
      currency,
      shipping_cost_cents,
      shipping_preference,
      location_city,
      location_state,
      expires_at,
      created_at,
      view_count,
      save_count,
      game:games(
        id,
        name,
        slug,
        box_image_url,
        thumbnail_url
      ),
      images:listing_images(
        url,
        is_primary
      )
    `)
    .eq('seller_id', sellerId)

  if (status) {
    query = query.eq('status', status)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching seller listings:', error)
    throw error
  }

  return (data || []).map((item: Record<string, unknown>) => {
    const game = item.game as Record<string, unknown>
    const images = item.images as Array<{ url: string; is_primary: boolean }> | null
    const primaryImage = images?.find(img => img.is_primary)?.url || null

    return {
      id: item.id as string,
      listing_type: item.listing_type as ListingCardData['listing_type'],
      status: item.status as ListingCardData['status'],
      condition: item.condition as ListingCardData['condition'],
      price_cents: item.price_cents as number | null,
      currency: item.currency as string,
      shipping_cost_cents: item.shipping_cost_cents as number | null,
      shipping_preference: item.shipping_preference as ListingCardData['shipping_preference'],
      location_city: item.location_city as string | null,
      location_state: item.location_state as string | null,
      expires_at: item.expires_at as string | null,
      created_at: item.created_at as string,
      game_id: game.id as string,
      game_name: game.name as string,
      game_slug: game.slug as string,
      game_image: (game.box_image_url || game.thumbnail_url) as string | null,
      seller_id: sellerId,
      seller_username: null,
      seller_display_name: null,
      seller_avatar: null,
      seller_rating: null,
      seller_sales_count: 0,
      primary_image_url: primaryImage,
    }
  })
}

/**
 * Create a new listing
 */
export async function createListing(
  listing: MarketplaceListingInsert
): Promise<MarketplaceListing> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('marketplace_listings')
    .insert(listing)
    .select()
    .single()

  if (error) {
    console.error('Error creating listing:', error)
    throw error
  }

  return data as MarketplaceListing
}

/**
 * Update a listing
 */
export async function updateListing(
  listingId: string,
  updates: MarketplaceListingUpdate
): Promise<MarketplaceListing> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('marketplace_listings')
    .update(updates)
    .eq('id', listingId)
    .select()
    .single()

  if (error) {
    console.error('Error updating listing:', error)
    throw error
  }

  return data as MarketplaceListing
}

/**
 * Publish a listing (change from draft to active)
 */
export async function publishListing(
  listingId: string,
  durationDays: number = 30
): Promise<MarketplaceListing> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + durationDays)

  return updateListing(listingId, {
    status: 'active',
    published_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  })
}

/**
 * Cancel a listing
 */
export async function cancelListing(
  listingId: string
): Promise<MarketplaceListing> {
  return updateListing(listingId, {
    status: 'cancelled',
  })
}

/**
 * Delete a listing (only drafts/cancelled)
 */
export async function deleteListing(listingId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await (supabase as any)
    .from('marketplace_listings')
    .delete()
    .eq('id', listingId)

  if (error) {
    console.error('Error deleting listing:', error)
    throw error
  }
}

// =====================================================
// LISTING IMAGES
// =====================================================

/**
 * Add images to a listing
 */
export async function addListingImages(
  images: ListingImageInsert[]
): Promise<ListingImage[]> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('listing_images')
    .insert(images)
    .select()

  if (error) {
    console.error('Error adding listing images:', error)
    throw error
  }

  return data as ListingImage[]
}

/**
 * Set primary image for a listing
 */
export async function setPrimaryImage(
  listingId: string,
  imageId: string
): Promise<void> {
  const supabase = createClient()

  // First, unset all primary flags for this listing
  await (supabase as any)
    .from('listing_images')
    .update({ is_primary: false })
    .eq('listing_id', listingId)

  // Then set the new primary
  const { error } = await (supabase as any)
    .from('listing_images')
    .update({ is_primary: true })
    .eq('id', imageId)

  if (error) {
    console.error('Error setting primary image:', error)
    throw error
  }
}

/**
 * Delete a listing image
 */
export async function deleteListingImage(imageId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await (supabase as any)
    .from('listing_images')
    .delete()
    .eq('id', imageId)

  if (error) {
    console.error('Error deleting listing image:', error)
    throw error
  }
}

/**
 * Reorder listing images
 */
export async function reorderListingImages(
  listingId: string,
  imageIds: string[]
): Promise<void> {
  const supabase = createClient()

  // Update each image with its new order
  const updates = imageIds.map((id, index) =>
    (supabase as any)
      .from('listing_images')
      .update({ display_order: index })
      .eq('id', id)
      .eq('listing_id', listingId)
  )

  await Promise.all(updates)
}

// =====================================================
// LISTING SAVES (Watchlist)
// =====================================================

/**
 * Save a listing to watchlist
 */
export async function saveListing(
  userId: string,
  listingId: string,
  notes?: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await (supabase as any)
    .from('listing_saves')
    .insert({
      user_id: userId,
      listing_id: listingId,
      notes,
    })

  if (error && error.code !== '23505') {
    // Ignore duplicate key error
    console.error('Error saving listing:', error)
    throw error
  }
}

/**
 * Remove a listing from watchlist
 */
export async function unsaveListing(
  userId: string,
  listingId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await (supabase as any)
    .from('listing_saves')
    .delete()
    .eq('user_id', userId)
    .eq('listing_id', listingId)

  if (error) {
    console.error('Error unsaving listing:', error)
    throw error
  }
}

/**
 * Check if a listing is saved
 */
export async function isListingSaved(
  userId: string,
  listingId: string
): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('listing_saves')
    .select('id')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .maybeSingle()

  if (error) {
    console.error('Error checking listing save:', error)
    return false
  }

  return !!data
}

/**
 * Get user's saved listings
 */
export async function getSavedListings(
  userId: string
): Promise<ListingCardData[]> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('listing_saves')
    .select(`
      listing:marketplace_listings(
        id,
        listing_type,
        status,
        condition,
        price_cents,
        currency,
        shipping_cost_cents,
        shipping_preference,
        location_city,
        location_state,
        expires_at,
        created_at,
        game:games(
          id,
          name,
          slug,
          box_image_url,
          thumbnail_url
        ),
        seller:user_profiles(
          id,
          username,
          display_name,
          avatar_url,
          custom_avatar_url
        ),
        images:listing_images(
          url,
          is_primary
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching saved listings:', error)
    throw error
  }

  return (data || [])
    .filter((item: Record<string, unknown>) => item.listing)
    .map((item: Record<string, unknown>) => {
      const listing = item.listing as Record<string, unknown>
      const game = listing.game as Record<string, unknown>
      const seller = listing.seller as Record<string, unknown>
      const images = listing.images as Array<{ url: string; is_primary: boolean }> | null
      const primaryImage = images?.find(img => img.is_primary)?.url || null

      return {
        id: listing.id as string,
        listing_type: listing.listing_type as ListingCardData['listing_type'],
        status: listing.status as ListingCardData['status'],
        condition: listing.condition as ListingCardData['condition'],
        price_cents: listing.price_cents as number | null,
        currency: listing.currency as string,
        shipping_cost_cents: listing.shipping_cost_cents as number | null,
        shipping_preference: listing.shipping_preference as ListingCardData['shipping_preference'],
        location_city: listing.location_city as string | null,
        location_state: listing.location_state as string | null,
        expires_at: listing.expires_at as string | null,
        created_at: listing.created_at as string,
        game_id: game.id as string,
        game_name: game.name as string,
        game_slug: game.slug as string,
        game_image: (game.box_image_url || game.thumbnail_url) as string | null,
        seller_id: seller.id as string,
        seller_username: seller.username as string | null,
        seller_display_name: seller.display_name as string | null,
        seller_avatar: (seller.custom_avatar_url || seller.avatar_url) as string | null,
        seller_rating: null,
        seller_sales_count: 0,
        primary_image_url: primaryImage,
      }
    })
}

// =====================================================
// USER MARKETPLACE SETTINGS
// =====================================================

/**
 * Get or create user marketplace settings
 */
export async function getUserMarketplaceSettings(
  userId: string
): Promise<UserMarketplaceSettings | null> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('user_marketplace_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching marketplace settings:', error)
    throw error
  }

  return data as UserMarketplaceSettings | null
}

/**
 * Create user marketplace settings
 */
export async function createUserMarketplaceSettings(
  userId: string,
  settings: Partial<UserMarketplaceSettings> = {}
): Promise<UserMarketplaceSettings> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('user_marketplace_settings')
    .insert({
      user_id: userId,
      ...settings,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating marketplace settings:', error)
    throw error
  }

  return data as UserMarketplaceSettings
}

/**
 * Update user marketplace settings
 */
export async function updateUserMarketplaceSettings(
  userId: string,
  updates: Partial<UserMarketplaceSettings>
): Promise<UserMarketplaceSettings> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('user_marketplace_settings')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating marketplace settings:', error)
    throw error
  }

  return data as UserMarketplaceSettings
}

// =====================================================
// STATS
// =====================================================

/**
 * Get listing counts by status for a seller
 */
export async function getSellerListingStats(
  sellerId: string
): Promise<Record<MarketplaceListing['status'], number>> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('marketplace_listings')
    .select('status')
    .eq('seller_id', sellerId)

  if (error) {
    console.error('Error fetching listing stats:', error)
    throw error
  }

  const stats: Record<MarketplaceListing['status'], number> = {
    draft: 0,
    active: 0,
    pending: 0,
    sold: 0,
    traded: 0,
    expired: 0,
    cancelled: 0,
  }

  for (const item of data || []) {
    const status = item.status as MarketplaceListing['status']
    stats[status] = (stats[status] || 0) + 1
  }

  return stats
}

/**
 * Get total listing count for a game (for game pages)
 */
export async function getGameListingCount(gameId: string): Promise<number> {
  const supabase = createClient()

  const { count, error } = await (supabase as any)
    .from('marketplace_listings')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', gameId)
    .eq('status', 'active')

  if (error) {
    console.error('Error fetching game listing count:', error)
    return 0
  }

  return count || 0
}
