import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LISTING_LIMITS, MARKETPLACE_FEES } from '@/lib/config/marketplace-constants'
import type { MarketplaceListingInsert } from '@/types/marketplace'

/**
 * POST /api/marketplace/listings
 * Create a new listing
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { listing, durationDays = LISTING_LIMITS.DEFAULT_DURATION_DAYS } = body as {
      listing: MarketplaceListingInsert
      durationDays?: number
    }

    // Validate required fields
    if (!listing.game_id) {
      return NextResponse.json({ error: 'Game is required' }, { status: 400 })
    }

    if (listing.listing_type !== 'want' && !listing.condition) {
      return NextResponse.json({ error: 'Condition is required for sell/trade listings' }, { status: 400 })
    }

    if (listing.listing_type === 'sell') {
      if (!listing.price_cents || listing.price_cents < MARKETPLACE_FEES.MIN_PRICE_CENTS) {
        return NextResponse.json(
          { error: `Price must be at least $${MARKETPLACE_FEES.MIN_PRICE_CENTS / 100}` },
          { status: 400 }
        )
      }
      if (listing.price_cents > MARKETPLACE_FEES.MAX_PRICE_CENTS) {
        return NextResponse.json(
          { error: `Price cannot exceed $${MARKETPLACE_FEES.MAX_PRICE_CENTS / 100}` },
          { status: 400 }
        )
      }
    }

    // Validate duration
    const validDuration = Math.min(
      Math.max(durationDays, 1),
      LISTING_LIMITS.MAX_DURATION_DAYS
    )

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + validDuration)

    // Create the listing
    const listingData: MarketplaceListingInsert = {
      seller_id: user.id,
      game_id: listing.game_id,
      listing_type: listing.listing_type,
      condition: listing.condition,
      description: listing.description?.slice(0, LISTING_LIMITS.MAX_DESCRIPTION_LENGTH) || null,
      price_cents: listing.price_cents,
      currency: listing.currency || 'USD',
      shipping_cost_cents: listing.shipping_cost_cents,
      shipping_preference: listing.shipping_preference,
      trade_preferences: listing.trade_preferences,
      location_city: listing.location_city,
      location_state: listing.location_state,
      location_country: listing.location_country || 'US',
      status: 'active', // Auto-publish
      published_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('marketplace_listings')
      .insert(listingData)
      .select()
      .single()

    if (error) {
      console.error('Error creating listing:', error)
      return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
    }

    return NextResponse.json({ listing: data })
  } catch (error) {
    console.error('Error in POST /api/marketplace/listings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
