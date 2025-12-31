/**
 * Wishlist Alert Detail API
 *
 * GET - Get a single wishlist alert
 * PATCH - Update a wishlist alert
 * DELETE - Delete a wishlist alert
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  updateWishlistAlert,
  deleteWishlistAlert,
} from '@/lib/supabase/discovery-queries'
import type { UpdateWishlistAlertRequest, GameCondition } from '@/types/marketplace'

interface RouteParams {
  params: Promise<{ id: string }>
}

const VALID_CONDITIONS: GameCondition[] = [
  'new_sealed',
  'like_new',
  'very_good',
  'good',
  'acceptable',
]

/**
 * GET - Get a single wishlist alert by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: alert, error } = await (supabase as any)
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
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !alert) {
      return NextResponse.json(
        { error: 'Wishlist alert not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Error fetching wishlist alert:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlist alert' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update a wishlist alert
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as UpdateWishlistAlertRequest

    // Validate conditions if provided
    if (body.accepted_conditions) {
      const invalidCondition = body.accepted_conditions.find(
        (c) => !VALID_CONDITIONS.includes(c)
      )
      if (invalidCondition) {
        return NextResponse.json(
          { error: `Invalid condition: ${invalidCondition}` },
          { status: 400 }
        )
      }
    }

    // Validate price if provided
    if (
      body.max_price_cents !== undefined &&
      body.max_price_cents !== null &&
      body.max_price_cents < 0
    ) {
      return NextResponse.json(
        { error: 'max_price_cents must be positive' },
        { status: 400 }
      )
    }

    // Check alert exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: existingError } = await (supabase as any)
      .from('wishlist_alerts')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (existingError || !existing) {
      return NextResponse.json(
        { error: 'Wishlist alert not found' },
        { status: 404 }
      )
    }

    const alert = await updateWishlistAlert(id, user.id, body)

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Error updating wishlist alert:', error)
    return NextResponse.json(
      { error: 'Failed to update wishlist alert' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete a wishlist alert
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check alert exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: existingError } = await (supabase as any)
      .from('wishlist_alerts')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (existingError || !existing) {
      return NextResponse.json(
        { error: 'Wishlist alert not found' },
        { status: 404 }
      )
    }

    await deleteWishlistAlert(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting wishlist alert:', error)
    return NextResponse.json(
      { error: 'Failed to delete wishlist alert' },
      { status: 500 }
    )
  }
}
