import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  updateRSVP,
  isTableParticipant,
  removeParticipant,
} from '@/lib/supabase/table-queries'
import type { RSVPStatus } from '@/types/tables'

interface RouteContext {
  params: Promise<{ id: string }>
}

const VALID_RSVP_STATUSES: RSVPStatus[] = ['attending', 'maybe', 'declined']

/**
 * POST /api/tables/[id]/rsvp
 * Update RSVP status for the current user
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  const { id: tableId } = await context.params

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a participant
    const isParticipant = await isTableParticipant(tableId, user.id)
    if (!isParticipant) {
      return NextResponse.json({ error: 'You are not invited to this table' }, { status: 403 })
    }

    const body = await request.json()
    const { rsvpStatus } = body as { rsvpStatus: RSVPStatus }

    if (!rsvpStatus || !VALID_RSVP_STATUSES.includes(rsvpStatus)) {
      return NextResponse.json(
        { error: 'Invalid RSVP status. Must be: attending, maybe, or declined' },
        { status: 400 }
      )
    }

    const success = await updateRSVP(tableId, user.id, rsvpStatus)

    if (!success) {
      return NextResponse.json({ error: 'Failed to update RSVP' }, { status: 500 })
    }

    return NextResponse.json({ rsvpStatus })
  } catch (error) {
    console.error('Error updating RSVP:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/tables/[id]/rsvp
 * Leave a table (remove self as participant)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  const { id: tableId } = await context.params

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a participant (but not host - hosts can't leave their own table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: participant } = await (supabase as any)
      .from('table_participants')
      .select('is_host')
      .eq('table_id', tableId)
      .eq('user_id', user.id)
      .single()

    if (!participant) {
      return NextResponse.json({ error: 'You are not a participant of this table' }, { status: 403 })
    }

    if (participant.is_host) {
      return NextResponse.json(
        { error: 'Host cannot leave their own table. Cancel or delete the table instead.' },
        { status: 400 }
      )
    }

    const success = await removeParticipant(tableId, user.id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to leave table' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error leaving table:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
