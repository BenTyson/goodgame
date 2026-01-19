import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getTableWithDetails,
  getTableParticipants,
  updateTable,
  deleteTable,
  isTableHost,
  isTableParticipant,
} from '@/lib/supabase/table-queries'
import type { UpdateTableInput } from '@/types/tables'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/tables/[id]
 * Get a single table with details and participants
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get table details (RLS will handle access control)
    const table = await getTableWithDetails(id, user?.id)

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    // Get participants
    const participants = await getTableParticipants(id)

    return NextResponse.json({ table, participants })
  } catch (error) {
    console.error('Error fetching table:', error)
    return NextResponse.json({ error: 'Failed to fetch table' }, { status: 500 })
  }
}

/**
 * PATCH /api/tables/[id]
 * Update a table (host only)
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is the host
    const isHost = await isTableHost(id, user.id)
    if (!isHost) {
      return NextResponse.json({ error: 'Only the host can update this table' }, { status: 403 })
    }

    const body = await request.json() as UpdateTableInput

    const success = await updateTable(id, body)

    if (!success) {
      return NextResponse.json({ error: 'Failed to update table' }, { status: 500 })
    }

    // Return updated table
    const table = await getTableWithDetails(id, user.id)

    return NextResponse.json({ table })
  } catch (error) {
    console.error('Error updating table:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/tables/[id]
 * Delete a table (host only)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is the host
    const isHost = await isTableHost(id, user.id)
    if (!isHost) {
      return NextResponse.json({ error: 'Only the host can delete this table' }, { status: 403 })
    }

    const success = await deleteTable(id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting table:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
