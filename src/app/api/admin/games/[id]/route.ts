import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// Allowed fields that can be updated via this endpoint
const ALLOWED_FIELDS = [
  'amazon_asin',
  'tagline',
  'meta_description',
] as const

type AllowedField = typeof ALLOWED_FIELDS[number]

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const body = await request.json()

    // Filter to only allowed fields
    const updates: Partial<Record<AllowedField, unknown>> = {}
    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get the game slug for cache revalidation
    const { data: game } = await supabase
      .from('games')
      .select('slug')
      .eq('id', gameId)
      .single()

    // Update the game
    const { error } = await supabase
      .from('games')
      .update(updates)
      .eq('id', gameId)

    if (error) {
      console.error('Failed to update game:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Revalidate the game page cache
    if (game?.slug) {
      revalidatePath(`/games/${game.slug}`)
    }

    return NextResponse.json({ success: true, updated: Object.keys(updates) })
  } catch (error) {
    console.error('Error in PATCH /api/admin/games/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
