import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  completeTableWithRecap,
  getTableRecap,
  updateTableRecap,
  isTableHost,
} from '@/lib/supabase/table-queries'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/tables/[id]/recap - Get table recap
export async function GET(request: NextRequest, context: RouteContext) {
  const { id: tableId } = await context.params

  try {
    const supabase = await createClient()
    const recap = await getTableRecap(tableId, supabase)

    if (!recap) {
      return NextResponse.json(
        { error: 'Recap not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ recap })
  } catch (error) {
    console.error('Error fetching recap:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recap' },
      { status: 500 }
    )
  }
}

// POST /api/tables/[id]/recap - Create recap and complete table
export async function POST(request: NextRequest, context: RouteContext) {
  const { id: tableId } = await context.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Verify user is the host
  const isHost = await isTableHost(tableId, user.id)
  if (!isHost) {
    return NextResponse.json(
      { error: 'Only the host can create a recap' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { hostNotes, highlights, experienceRating, wouldPlayAgain, attendeeIds } = body

    // Validate attendeeIds
    if (!Array.isArray(attendeeIds)) {
      return NextResponse.json(
        { error: 'attendeeIds must be an array' },
        { status: 400 }
      )
    }

    // Validate experienceRating if provided
    if (experienceRating !== undefined && (experienceRating < 1 || experienceRating > 5)) {
      return NextResponse.json(
        { error: 'experienceRating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const result = await completeTableWithRecap(tableId, {
      hostNotes,
      highlights,
      experienceRating,
      wouldPlayAgain,
      attendeeIds,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to complete table' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      recapId: result.recapId,
      attendeeCount: result.attendeeCount,
    })
  } catch (error) {
    console.error('Error creating recap:', error)
    return NextResponse.json(
      { error: 'Failed to create recap' },
      { status: 500 }
    )
  }
}

// PATCH /api/tables/[id]/recap - Update recap
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: tableId } = await context.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Verify user is the host
  const isHost = await isTableHost(tableId, user.id)
  if (!isHost) {
    return NextResponse.json(
      { error: 'Only the host can update a recap' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { hostNotes, highlights, experienceRating, wouldPlayAgain } = body

    // Validate experienceRating if provided
    if (experienceRating !== undefined && (experienceRating < 1 || experienceRating > 5)) {
      return NextResponse.json(
        { error: 'experienceRating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const success = await updateTableRecap(tableId, {
      hostNotes,
      highlights,
      experienceRating,
      wouldPlayAgain,
    })

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update recap' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating recap:', error)
    return NextResponse.json(
      { error: 'Failed to update recap' },
      { status: 500 }
    )
  }
}
