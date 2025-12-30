import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getListingById, updateListing, cancelListing } from '@/lib/supabase/listing-queries'
import { LISTING_LIMITS, MARKETPLACE_FEES } from '@/lib/config/marketplace-constants'
import type { MarketplaceListingUpdate } from '@/types/marketplace'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/marketplace/listings/[id]
 * Get a single listing by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const listing = await getListingById(id)

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    return NextResponse.json({ listing })
  } catch (error) {
    console.error('Error in GET /api/marketplace/listings/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/marketplace/listings/[id]
 * Update a listing
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const listing = await getListingById(id)

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updates = body.updates as MarketplaceListingUpdate

    // Validate price if updating
    if (updates.price_cents !== undefined && updates.price_cents !== null) {
      if (updates.price_cents < MARKETPLACE_FEES.MIN_PRICE_CENTS) {
        return NextResponse.json(
          { error: `Price must be at least $${MARKETPLACE_FEES.MIN_PRICE_CENTS / 100}` },
          { status: 400 }
        )
      }
      if (updates.price_cents > MARKETPLACE_FEES.MAX_PRICE_CENTS) {
        return NextResponse.json(
          { error: `Price cannot exceed $${MARKETPLACE_FEES.MAX_PRICE_CENTS / 100}` },
          { status: 400 }
        )
      }
    }

    // Truncate description if too long
    if (updates.description) {
      updates.description = updates.description.slice(0, LISTING_LIMITS.MAX_DESCRIPTION_LENGTH)
    }

    const updatedListing = await updateListing(id, updates)
    return NextResponse.json({ listing: updatedListing })
  } catch (error) {
    console.error('Error in PATCH /api/marketplace/listings/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/marketplace/listings/[id]
 * Cancel a listing (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const listing = await getListingById(id)

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Can only cancel active or pending listings
    if (listing.status !== 'active' && listing.status !== 'pending' && listing.status !== 'draft') {
      return NextResponse.json(
        { error: 'Cannot delete a listing that is already sold, traded, expired, or cancelled' },
        { status: 400 }
      )
    }

    await cancelListing(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/marketplace/listings/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
