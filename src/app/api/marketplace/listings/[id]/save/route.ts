import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { saveListing, unsaveListing } from '@/lib/supabase/listing-queries'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/marketplace/listings/[id]/save
 * Save a listing to the user's watchlist
 */
export async function POST(
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

    // Get optional notes from body
    let notes: string | undefined
    try {
      const body = await request.json()
      notes = body.notes
    } catch {
      // No body, that's fine
    }

    await saveListing(user.id, id, notes)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/marketplace/listings/[id]/save:', error)
    return NextResponse.json({ error: 'Failed to save listing' }, { status: 500 })
  }
}

/**
 * DELETE /api/marketplace/listings/[id]/save
 * Remove a listing from the user's watchlist
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
    await unsaveListing(user.id, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/marketplace/listings/[id]/save:', error)
    return NextResponse.json({ error: 'Failed to unsave listing' }, { status: 500 })
  }
}
