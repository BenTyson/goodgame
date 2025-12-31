/**
 * Marketplace Discovery Queries
 *
 * Query functions for saved searches, wishlist alerts, and similar listings.
 *
 * NOTE: Uses type assertions (as any) for new tables until database types
 * are regenerated after running migrations.
 */

import { createClient } from './server'
import type {
  SavedSearch,
  SavedSearchFilters,
  SavedSearchInsert,
  SavedSearchUpdate,
  WishlistAlert,
  WishlistAlertWithGame,
  WishlistAlertInsert,
  WishlistAlertUpdate,
  AlertFrequency,
  ListingCardData,
  GameCondition,
} from '@/types/marketplace'

// ===========================================
// SAVED SEARCHES
// ===========================================

/**
 * Get user's saved searches
 */
export async function getUserSavedSearches(
  userId: string,
  status?: 'active' | 'paused' | 'expired'
): Promise<SavedSearch[]> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('saved_searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching saved searches:', error)
    throw error
  }

  return (data || []) as SavedSearch[]
}

/**
 * Get a single saved search by ID
 */
export async function getSavedSearch(
  id: string,
  userId: string
): Promise<SavedSearch | null> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('saved_searches')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching saved search:', error)
    throw error
  }

  return data as SavedSearch
}

/**
 * Create a saved search
 */
export async function createSavedSearch(
  userId: string,
  data: SavedSearchInsert
): Promise<SavedSearch> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await (supabase as any)
    .from('saved_searches')
    .insert({
      user_id: userId,
      name: data.name,
      filters: data.filters as unknown as Record<string, unknown>,
      alert_frequency: data.alert_frequency || 'instant',
      alert_email: data.alert_email ?? true,
      alerts_enabled: true,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating saved search:', error)
    throw error
  }

  return result as SavedSearch
}

/**
 * Update a saved search
 */
export async function updateSavedSearch(
  id: string,
  userId: string,
  data: SavedSearchUpdate
): Promise<SavedSearch> {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.filters !== undefined) updateData.filters = data.filters as unknown as Record<string, unknown>
  if (data.alerts_enabled !== undefined) updateData.alerts_enabled = data.alerts_enabled
  if (data.alert_frequency !== undefined) updateData.alert_frequency = data.alert_frequency
  if (data.alert_email !== undefined) updateData.alert_email = data.alert_email
  if (data.status !== undefined) updateData.status = data.status

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await (supabase as any)
    .from('saved_searches')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating saved search:', error)
    throw error
  }

  return result as SavedSearch
}

/**
 * Delete a saved search
 */
export async function deleteSavedSearch(
  id: string,
  userId: string
): Promise<void> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('saved_searches')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting saved search:', error)
    throw error
  }
}

/**
 * Toggle saved search alerts
 */
export async function toggleSavedSearchAlerts(
  id: string,
  userId: string,
  enabled: boolean
): Promise<SavedSearch> {
  return updateSavedSearch(id, userId, { alerts_enabled: enabled })
}

/**
 * Get saved search count for user
 */
export async function getSavedSearchCount(userId: string): Promise<number> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count, error } = await (supabase as any)
    .from('saved_searches')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    console.error('Error counting saved searches:', error)
    throw error
  }

  return count || 0
}

// ===========================================
// WISHLIST ALERTS
// ===========================================

/**
 * Get user's wishlist alerts with game info
 */
export async function getUserWishlistAlerts(
  userId: string
): Promise<WishlistAlertWithGame[]> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('wishlist_alerts')
    .select(`
      *,
      games:game_id (
        id,
        name,
        slug,
        thumbnail_url,
        box_image_url
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching wishlist alerts:', error)
    throw error
  }

  return (data || []).map((item: Record<string, unknown>) => {
    const game = item.games as unknown as {
      id: string
      name: string
      slug: string
      thumbnail_url: string | null
      box_image_url: string | null
    }
    return {
      ...item,
      game_name: game?.name || '',
      game_slug: game?.slug || '',
      game_image: game?.thumbnail_url || game?.box_image_url || null,
    } as WishlistAlertWithGame
  })
}

/**
 * Get wishlist alert for a specific game
 */
export async function getWishlistAlert(
  userId: string,
  gameId: string
): Promise<WishlistAlert | null> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('wishlist_alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching wishlist alert:', error)
    throw error
  }

  return data as WishlistAlert | null
}

/**
 * Create or update a wishlist alert
 */
export async function upsertWishlistAlert(
  userId: string,
  data: WishlistAlertInsert
): Promise<WishlistAlert> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await (supabase as any)
    .from('wishlist_alerts')
    .upsert(
      {
        user_id: userId,
        game_id: data.game_id,
        max_price_cents: data.max_price_cents,
        accepted_conditions: data.accepted_conditions || ['new_sealed', 'like_new', 'very_good'],
        local_only: data.local_only || false,
        max_distance_miles: data.max_distance_miles,
        alerts_enabled: true,
        status: 'active',
      },
      { onConflict: 'user_id,game_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('Error upserting wishlist alert:', error)
    throw error
  }

  return result as WishlistAlert
}

/**
 * Update a wishlist alert
 */
export async function updateWishlistAlert(
  id: string,
  userId: string,
  data: WishlistAlertUpdate
): Promise<WishlistAlert> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: result, error } = await (supabase as any)
    .from('wishlist_alerts')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating wishlist alert:', error)
    throw error
  }

  return result as WishlistAlert
}

/**
 * Delete a wishlist alert
 */
export async function deleteWishlistAlert(
  id: string,
  userId: string
): Promise<void> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('wishlist_alerts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting wishlist alert:', error)
    throw error
  }
}

/**
 * Toggle wishlist alert
 */
export async function toggleWishlistAlert(
  id: string,
  userId: string,
  enabled: boolean
): Promise<WishlistAlert> {
  return updateWishlistAlert(id, userId, { alerts_enabled: enabled })
}

// ===========================================
// SIMILAR LISTINGS
// ===========================================

/**
 * Get similar listings for a listing
 */
export async function getSimilarListings(
  listingId: string,
  limit: number = 6
): Promise<ListingCardData[]> {
  const supabase = await createClient()

  // Call the database function to get similar listings with scores
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: similarIds, error: similarError } = await (supabase as any).rpc(
    'get_similar_listings',
    {
      p_listing_id: listingId,
      p_limit: limit,
    }
  )

  if (similarError) {
    console.error('Error fetching similar listings:', similarError)
    return []
  }

  if (!similarIds || similarIds.length === 0) {
    return []
  }

  // Fetch full listing data for the similar listings
  const listingIds = similarIds.map((s: { listing_id: string }) => s.listing_id)

  const { data: listings, error: listingsError } = await supabase
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
      game:game_id (
        id,
        name,
        slug,
        thumbnail_url,
        box_image_url
      ),
      seller:seller_id (
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      ),
      marketplace_settings:seller_id (
        seller_rating,
        total_sales
      ),
      primary_image:listing_images!inner (
        url
      )
    `)
    .in('id', listingIds)
    .eq('listing_images.is_primary', true)

  if (listingsError) {
    console.error('Error fetching similar listing details:', listingsError)
    return []
  }

  // Map to ListingCardData format
  return (listings || []).map((l) => {
    const game = l.game as unknown as {
      id: string
      name: string
      slug: string
      thumbnail_url: string | null
      box_image_url: string | null
    }
    const seller = l.seller as unknown as {
      id: string
      username: string | null
      display_name: string | null
      avatar_url: string | null
      custom_avatar_url: string | null
    }
    const settings = l.marketplace_settings as unknown as {
      seller_rating: number | null
      total_sales: number
    } | null
    const primaryImage = (l.primary_image as unknown as { url: string }[])?.[0]

    return {
      id: l.id,
      listing_type: l.listing_type,
      status: l.status,
      condition: l.condition,
      price_cents: l.price_cents,
      currency: l.currency,
      shipping_cost_cents: l.shipping_cost_cents,
      shipping_preference: l.shipping_preference,
      location_city: l.location_city,
      location_state: l.location_state,
      expires_at: l.expires_at,
      created_at: l.created_at,
      game_id: game?.id || '',
      game_name: game?.name || '',
      game_slug: game?.slug || '',
      game_image: game?.thumbnail_url || game?.box_image_url || null,
      seller_id: seller?.id || '',
      seller_username: seller?.username,
      seller_display_name: seller?.display_name,
      seller_avatar: seller?.custom_avatar_url || seller?.avatar_url,
      seller_rating: settings?.seller_rating || null,
      seller_sales_count: settings?.total_sales || 0,
      primary_image_url: primaryImage?.url || null,
    } as ListingCardData
  })
}

// ===========================================
// RE-EXPORT HELPER FUNCTIONS
// ===========================================

// Re-export client-safe utilities for server-side usage
export {
  generateSavedSearchName,
  listingFiltersToSavedSearchFilters,
} from '@/lib/utils/saved-search-utils'
