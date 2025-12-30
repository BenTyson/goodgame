import { Suspense } from 'react'

import { createClient } from '@/lib/supabase/server'
import { MarketplacePageClient } from './MarketplacePageClient'
import { ListingGridSkeleton } from '@/components/marketplace'
import type { ListingFilters, ListingCardData } from '@/types/marketplace'
import { MARKETPLACE_PAGINATION } from '@/lib/config/marketplace-constants'

export const dynamic = 'force-dynamic'

interface MarketplacePageProps {
  searchParams: Promise<{
    type?: string
    condition?: string
    shipping?: string
    price_min?: string
    price_max?: string
    q?: string
    sort?: string
  }>
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Parse filter parameters
  const filters: ListingFilters = {
    listing_types: params.type?.split(',').filter(Boolean) as ListingFilters['listing_types'],
    conditions: params.condition?.split(',').filter(Boolean) as ListingFilters['conditions'],
    shipping_preferences: params.shipping?.split(',').filter(Boolean) as ListingFilters['shipping_preferences'],
    price_min_cents: params.price_min ? parseInt(params.price_min) * 100 : undefined,
    price_max_cents: params.price_max ? parseInt(params.price_max) * 100 : undefined,
    query: params.q || undefined,
    sort_by: (params.sort as ListingFilters['sort_by']) || 'newest',
    limit: MARKETPLACE_PAGINATION.LISTINGS_PAGE_SIZE,
    offset: 0,
  }

  const hasFilters =
    (filters.listing_types && filters.listing_types.length > 0) ||
    (filters.conditions && filters.conditions.length > 0) ||
    (filters.shipping_preferences && filters.shipping_preferences.length > 0) ||
    filters.price_min_cents !== undefined ||
    filters.price_max_cents !== undefined ||
    !!filters.query

  // Fetch listings with filters
  const { listings, total } = await getListingsServer(supabase, filters)

  // Fetch saved listings for current user
  // TODO: Enable after database types are regenerated
  const savedListingIds: string[] = []
  // if (user) {
  //   const { data: saves } = await supabase
  //     .from('listing_saves')
  //     .select('listing_id')
  //     .eq('user_id', user.id)
  //   savedListingIds = (saves || []).map((s) => s.listing_id)
  // }

  return (
    <Suspense fallback={<MarketplacePageSkeleton />}>
      <MarketplacePageClient
        listings={listings}
        hasFilters={hasFilters}
        totalCount={total}
        isAuthenticated={!!user}
        savedListingIds={savedListingIds}
      />
    </Suspense>
  )
}

/**
 * Server-side listing query using the server client
 *
 * NOTE: Uses type casting to bypass TypeScript errors until database types
 * are regenerated after running migrations. Remove 'as any' casts after
 * running: npx supabase gen types typescript --local > src/types/supabase.ts
 */
async function getListingsServer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: ListingFilters
): Promise<{ listings: ListingCardData[]; total: number }> {
  const limit = filters.limit || MARKETPLACE_PAGINATION.LISTINGS_PAGE_SIZE
  const offset = filters.offset || 0

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // Check if the error is because the table doesn't exist (migrations not run)
    const errorMessage = error.message || error.code || JSON.stringify(error)
    if (errorMessage.includes('does not exist') || error.code === '42P01') {
      console.warn('Marketplace tables not yet created. Run migrations to enable marketplace.')
    } else {
      console.error('Error fetching listings:', errorMessage)
    }
    return { listings: [], total: 0 }
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
  }
}

function MarketplacePageSkeleton() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="h-5 w-96 bg-muted animate-pulse rounded mt-2" />
      </div>
      <div className="h-10 w-full max-w-xl bg-muted/30 animate-pulse rounded-lg mb-6" />
      <div className="flex gap-6">
        <div className="hidden lg:block w-64 h-96 bg-muted animate-pulse rounded-lg" />
        <div className="flex-1">
          <ListingGridSkeleton count={8} />
        </div>
      </div>
    </div>
  )
}
