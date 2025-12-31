/**
 * Wishlist Alerts API
 *
 * GET - List user's wishlist alerts
 * POST - Create a new wishlist alert
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getUserWishlistAlerts,
  upsertWishlistAlert,
  getWishlistAlert,
} from '@/lib/supabase/discovery-queries'
import type {
  CreateWishlistAlertRequest,
  WishlistAlertsResponse,
  GameCondition,
} from '@/types/marketplace'
import { WISHLIST_ALERT_SETTINGS } from '@/lib/config/marketplace-constants'

const VALID_CONDITIONS: GameCondition[] = [
  'new_sealed',
  'like_new',
  'very_good',
  'good',
  'acceptable',
]

/**
 * GET - List wishlist alerts for current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const alerts = await getUserWishlistAlerts(user.id)

    return NextResponse.json<WishlistAlertsResponse>({
      alerts,
      total: alerts.length,
    })
  } catch (error) {
    console.error('Error fetching wishlist alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlist alerts' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create or update a wishlist alert
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as CreateWishlistAlertRequest
    const {
      game_id,
      max_price_cents,
      accepted_conditions,
      local_only,
      max_distance_miles,
    } = body

    // Validate game_id
    if (!game_id) {
      return NextResponse.json(
        { error: 'game_id is required' },
        { status: 400 }
      )
    }

    // Validate game exists
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('id', game_id)
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Validate conditions
    const conditions = accepted_conditions || WISHLIST_ALERT_SETTINGS.DEFAULT_CONDITIONS
    const invalidCondition = conditions.find((c) => !VALID_CONDITIONS.includes(c))
    if (invalidCondition) {
      return NextResponse.json(
        { error: `Invalid condition: ${invalidCondition}` },
        { status: 400 }
      )
    }

    // Validate price
    if (max_price_cents !== undefined && max_price_cents !== null && max_price_cents < 0) {
      return NextResponse.json(
        { error: 'max_price_cents must be positive' },
        { status: 400 }
      )
    }

    // Create or update alert
    const alert = await upsertWishlistAlert(user.id, {
      game_id,
      max_price_cents,
      accepted_conditions: conditions as GameCondition[],
      local_only: local_only || false,
      max_distance_miles,
    })

    return NextResponse.json({ alert }, { status: 201 })
  } catch (error) {
    console.error('Error creating wishlist alert:', error)
    return NextResponse.json(
      { error: 'Failed to create wishlist alert' },
      { status: 500 }
    )
  }
}
