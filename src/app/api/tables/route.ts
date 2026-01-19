import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getUserUpcomingTables,
  getUserPastTables,
} from '@/lib/supabase/table-queries'
import type { CreateTableInput } from '@/types/tables'

/**
 * GET /api/tables
 * Get tables for the current user
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') || 'upcoming' // 'upcoming' | 'past'
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let tables

    if (type === 'past') {
      tables = await getUserPastTables(user.id, limit, offset)
    } else {
      tables = await getUserUpcomingTables(user.id, limit)
    }

    return NextResponse.json({
      tables,
      hasMore: tables.length === limit,
    })
  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
  }
}

/**
 * POST /api/tables
 * Create a new table
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as CreateTableInput

    // Validate required fields
    if (!body.gameId) {
      return NextResponse.json({ error: 'Game is required' }, { status: 400 })
    }

    if (!body.scheduledAt) {
      return NextResponse.json({ error: 'Scheduled time is required' }, { status: 400 })
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(body.scheduledAt)
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 400 })
    }

    // Create the table using the server client (has auth context)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: result, error: createError } = await (supabase as any)
      .from('tables')
      .insert({
        host_id: user.id,
        game_id: body.gameId,
        title: body.title || null,
        description: body.description || null,
        scheduled_at: body.scheduledAt,
        duration_minutes: body.durationMinutes || 180,
        location_name: body.locationName || null,
        location_address: body.locationAddress || null,
        max_players: body.maxPlayers || null,
        privacy: body.privacy || 'private',
        status: 'scheduled',
      })
      .select('id')
      .single()

    if (createError) {
      console.error('Error creating table:', createError)
      return NextResponse.json({ error: 'Failed to create table' }, { status: 500 })
    }

    return NextResponse.json({ table: result }, { status: 201 })
  } catch (error) {
    console.error('Error creating table:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
