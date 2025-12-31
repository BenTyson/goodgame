/**
 * Saved Search Utilities (Client-safe)
 *
 * Helper functions for saved search functionality that can be used
 * in both client and server components.
 */

import type { SavedSearchFilters, GameCondition } from '@/types/marketplace'

/**
 * Generate a name for a saved search based on its filters
 */
export function generateSavedSearchName(filters: SavedSearchFilters): string {
  const parts: string[] = []

  if (filters.query) {
    parts.push(`"${filters.query}"`)
  }

  if (filters.listing_types?.length) {
    const types = filters.listing_types.map((t) =>
      t === 'sell' ? 'For Sale' : t === 'trade' ? 'For Trade' : 'Wanted'
    )
    parts.push(types.join('/'))
  }

  if (filters.price_max_cents) {
    parts.push(`Under $${(filters.price_max_cents / 100).toFixed(0)}`)
  }

  if (filters.conditions?.length) {
    const conditions = filters.conditions.length === 1
      ? formatCondition(filters.conditions[0])
      : `${filters.conditions.length} conditions`
    parts.push(conditions)
  }

  if (filters.max_distance_miles) {
    parts.push(`Within ${filters.max_distance_miles} mi`)
  }

  return parts.length > 0 ? parts.join(' • ') : 'All Listings'
}

function formatCondition(condition: GameCondition): string {
  const map: Record<GameCondition, string> = {
    new_sealed: 'New',
    like_new: 'Like New',
    very_good: 'Very Good',
    good: 'Good',
    acceptable: 'Acceptable',
  }
  return map[condition] || condition
}

/**
 * Convert listing filters to saved search filters
 */
export function listingFiltersToSavedSearchFilters(
  filters: Record<string, unknown>
): SavedSearchFilters {
  const result: SavedSearchFilters = {}

  if (filters.query) result.query = String(filters.query)
  if (filters.listing_types) result.listing_types = filters.listing_types as SavedSearchFilters['listing_types']
  if (filters.conditions) result.conditions = filters.conditions as SavedSearchFilters['conditions']
  if (filters.price_min_cents) result.price_min_cents = Number(filters.price_min_cents)
  if (filters.price_max_cents) result.price_max_cents = Number(filters.price_max_cents)
  if (filters.shipping_preferences) result.shipping_preferences = filters.shipping_preferences as SavedSearchFilters['shipping_preferences']
  if (filters.game_ids) result.game_ids = filters.game_ids as string[]
  if (filters.category_ids) result.category_ids = filters.category_ids as string[]
  if (filters.location_postal) result.location_postal = String(filters.location_postal)
  if (filters.max_distance_miles) result.max_distance_miles = Number(filters.max_distance_miles)

  return result
}
