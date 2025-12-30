import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getOfferById,
  acceptOffer,
  declineOffer,
  counterOffer,
  withdrawOffer,
} from '@/lib/supabase/offer-queries'
import { MARKETPLACE_FEES, OFFER_SETTINGS } from '@/lib/config/marketplace-constants'
import type { OfferActionRequest } from '@/types/marketplace'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/marketplace/offers/[id]
 * Get a single offer by ID with full details
 */
export async function GET(
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
    const offer = await getOfferById(id)

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    // Only buyer or seller can view the offer
    if (offer.buyer_id !== user.id && offer.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ offer })
  } catch (error) {
    console.error('Error in GET /api/marketplace/offers/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/marketplace/offers/[id]
 * Perform an action on an offer (accept, decline, counter, withdraw)
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
    const offer = await getOfferById(id)

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
    }

    // Only buyer or seller can modify the offer
    if (offer.buyer_id !== user.id && offer.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json() as OfferActionRequest

    if (!body.action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    // Validate action based on user role and offer status
    const isBuyer = offer.buyer_id === user.id
    const isSeller = offer.seller_id === user.id

    switch (body.action) {
      case 'accept': {
        // Only seller can accept
        if (!isSeller) {
          return NextResponse.json({ error: 'Only the seller can accept offers' }, { status: 403 })
        }

        // Can only accept pending offers
        if (offer.status !== 'pending') {
          return NextResponse.json({ error: 'Can only accept pending offers' }, { status: 400 })
        }

        // Check if expired
        if (new Date(offer.expires_at) < new Date()) {
          return NextResponse.json({ error: 'Offer has expired' }, { status: 400 })
        }

        const acceptedOffer = await acceptOffer(id, user.id, body.message)
        return NextResponse.json({ offer: acceptedOffer })
      }

      case 'decline': {
        // Only seller can decline
        if (!isSeller) {
          return NextResponse.json({ error: 'Only the seller can decline offers' }, { status: 403 })
        }

        // Can only decline pending offers
        if (offer.status !== 'pending') {
          return NextResponse.json({ error: 'Can only decline pending offers' }, { status: 400 })
        }

        const declinedOffer = await declineOffer(id, user.id, body.message)
        return NextResponse.json({ offer: declinedOffer })
      }

      case 'counter': {
        // Only seller can counter
        if (!isSeller) {
          return NextResponse.json({ error: 'Only the seller can counter offers' }, { status: 403 })
        }

        // Can only counter pending offers
        if (offer.status !== 'pending') {
          return NextResponse.json({ error: 'Can only counter pending offers' }, { status: 400 })
        }

        // Check if expired
        if (new Date(offer.expires_at) < new Date()) {
          return NextResponse.json({ error: 'Offer has expired' }, { status: 400 })
        }

        // Check counter chain limit
        if (offer.counter_count >= OFFER_SETTINGS.MAX_COUNTER_CHAIN) {
          return NextResponse.json(
            { error: `Maximum of ${OFFER_SETTINGS.MAX_COUNTER_CHAIN} counter-offers reached` },
            { status: 400 }
          )
        }

        // Validate counter offer details
        const hasAmount = body.counter_amount_cents !== undefined && body.counter_amount_cents !== null
        const hasTrades = body.counter_trade_game_ids && body.counter_trade_game_ids.length > 0

        if (!hasAmount && !hasTrades) {
          return NextResponse.json(
            { error: 'Counter-offer must include an amount or trade games' },
            { status: 400 }
          )
        }

        // Validate amount
        if (hasAmount) {
          if (body.counter_amount_cents! < MARKETPLACE_FEES.MIN_PRICE_CENTS) {
            return NextResponse.json(
              { error: `Counter-offer must be at least $${MARKETPLACE_FEES.MIN_PRICE_CENTS / 100}` },
              { status: 400 }
            )
          }
          if (body.counter_amount_cents! > MARKETPLACE_FEES.MAX_PRICE_CENTS) {
            return NextResponse.json(
              { error: `Counter-offer cannot exceed $${MARKETPLACE_FEES.MAX_PRICE_CENTS / 100}` },
              { status: 400 }
            )
          }
        }

        // Validate trade games
        if (hasTrades) {
          if (body.counter_trade_game_ids!.length > OFFER_SETTINGS.MAX_TRADE_GAMES) {
            return NextResponse.json(
              { error: `Cannot offer more than ${OFFER_SETTINGS.MAX_TRADE_GAMES} games in trade` },
              { status: 400 }
            )
          }

          // Verify seller owns these games
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: ownedGames } = await (supabase as any)
            .from('user_games')
            .select('game_id')
            .eq('user_id', user.id)
            .eq('status', 'owned')
            .in('game_id', body.counter_trade_game_ids!)

          if (!ownedGames || ownedGames.length !== body.counter_trade_game_ids!.length) {
            return NextResponse.json(
              { error: 'You can only offer games that are on your shelf as owned' },
              { status: 400 }
            )
          }
        }

        const newOffer = await counterOffer(
          id,
          user.id,
          body.counter_amount_cents,
          body.counter_trade_game_ids,
          body.message
        )
        return NextResponse.json({ offer: newOffer })
      }

      case 'withdraw': {
        // Only buyer can withdraw
        if (!isBuyer) {
          return NextResponse.json({ error: 'Only the buyer can withdraw offers' }, { status: 403 })
        }

        // Can only withdraw pending offers
        if (offer.status !== 'pending') {
          return NextResponse.json({ error: 'Can only withdraw pending offers' }, { status: 400 })
        }

        const withdrawnOffer = await withdrawOffer(id, user.id)
        return NextResponse.json({ offer: withdrawnOffer })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in PATCH /api/marketplace/offers/[id]:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Offer has expired')) {
        return NextResponse.json({ error: 'Offer has expired' }, { status: 400 })
      }
      if (error.message.includes('Only the seller')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message.includes('Only the buyer')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message.includes('Can only')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
