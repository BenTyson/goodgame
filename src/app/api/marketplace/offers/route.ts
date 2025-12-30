import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createOffer,
  getOffersByUser,
  hasPendingOffer,
} from '@/lib/supabase/offer-queries'
import { getListingById } from '@/lib/supabase/listing-queries'
import { MARKETPLACE_FEES, OFFER_SETTINGS } from '@/lib/config/marketplace-constants'
import type { CreateOfferRequest } from '@/types/marketplace'

/**
 * GET /api/marketplace/offers
 * Get offers for the current user (as buyer or seller)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = (searchParams.get('role') as 'buyer' | 'seller') || 'seller'
    const status = searchParams.get('status') || undefined
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const result = await getOffersByUser(user.id, role, {
      status: status as 'pending' | 'accepted' | 'declined' | 'countered' | 'expired' | 'withdrawn' | undefined,
      limit,
      offset,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/marketplace/offers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/marketplace/offers
 * Create a new offer on a listing
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as CreateOfferRequest

    // Validate required fields
    if (!body.listing_id) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    if (!body.offer_type) {
      return NextResponse.json({ error: 'Offer type is required' }, { status: 400 })
    }

    // Validate offer type
    if (!['buy', 'trade', 'buy_plus_trade'].includes(body.offer_type)) {
      return NextResponse.json({ error: 'Invalid offer type' }, { status: 400 })
    }

    // Get the listing to validate
    const listing = await getListingById(body.listing_id)

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Can't make offer on your own listing
    if (listing.seller_id === user.id) {
      return NextResponse.json({ error: 'Cannot make offer on your own listing' }, { status: 400 })
    }

    // Can only make offers on active listings that accept offers
    if (listing.status !== 'active') {
      return NextResponse.json({ error: 'Listing is not active' }, { status: 400 })
    }

    if (!listing.accepts_offers) {
      return NextResponse.json({ error: 'This listing does not accept offers' }, { status: 400 })
    }

    // Check if user already has a pending offer
    const hasExisting = await hasPendingOffer(user.id, body.listing_id)
    if (hasExisting) {
      return NextResponse.json(
        { error: 'You already have a pending offer on this listing' },
        { status: 400 }
      )
    }

    // Validate amount for buy and buy_plus_trade offers
    if (body.offer_type === 'buy' || body.offer_type === 'buy_plus_trade') {
      if (!body.amount_cents || body.amount_cents <= 0) {
        return NextResponse.json({ error: 'Amount is required for buy offers' }, { status: 400 })
      }

      if (body.amount_cents < MARKETPLACE_FEES.MIN_PRICE_CENTS) {
        return NextResponse.json(
          { error: `Offer must be at least $${MARKETPLACE_FEES.MIN_PRICE_CENTS / 100}` },
          { status: 400 }
        )
      }

      if (body.amount_cents > MARKETPLACE_FEES.MAX_PRICE_CENTS) {
        return NextResponse.json(
          { error: `Offer cannot exceed $${MARKETPLACE_FEES.MAX_PRICE_CENTS / 100}` },
          { status: 400 }
        )
      }

      // Check minimum offer if set on listing
      if (listing.minimum_offer_cents && body.amount_cents < listing.minimum_offer_cents) {
        return NextResponse.json(
          { error: `Minimum offer for this listing is $${listing.minimum_offer_cents / 100}` },
          { status: 400 }
        )
      }
    }

    // Validate trade games for trade and buy_plus_trade offers
    if (body.offer_type === 'trade' || body.offer_type === 'buy_plus_trade') {
      if (!body.trade_game_ids || body.trade_game_ids.length === 0) {
        return NextResponse.json(
          { error: 'At least one trade game is required for trade offers' },
          { status: 400 }
        )
      }

      if (body.trade_game_ids.length > OFFER_SETTINGS.MAX_TRADE_GAMES) {
        return NextResponse.json(
          { error: `Cannot offer more than ${OFFER_SETTINGS.MAX_TRADE_GAMES} games in trade` },
          { status: 400 }
        )
      }

      // Verify user owns these games (check shelf)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: ownedGames } = await (supabase as any)
        .from('user_games')
        .select('game_id')
        .eq('user_id', user.id)
        .eq('status', 'owned')
        .in('game_id', body.trade_game_ids)

      if (!ownedGames || ownedGames.length !== body.trade_game_ids.length) {
        return NextResponse.json(
          { error: 'You can only offer games that are on your shelf as owned' },
          { status: 400 }
        )
      }
    }

    // Validate message length
    if (body.message && body.message.length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 characters)' }, { status: 400 })
    }

    // Create the offer
    const offer = await createOffer({
      listing_id: body.listing_id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      offer_type: body.offer_type,
      amount_cents: body.amount_cents || null,
      trade_game_ids: body.trade_game_ids || [],
      trade_notes: body.trade_notes || null,
      message: body.message || null,
    })

    return NextResponse.json({ offer })
  } catch (error) {
    console.error('Error in POST /api/marketplace/offers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
