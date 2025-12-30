import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getConversationWithMessages,
  markConversationRead,
  archiveConversation,
} from '@/lib/supabase/conversation-queries'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/marketplace/conversations/[id]
 * Get a conversation with all messages
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
    const conversation = await getConversationWithMessages(id, user.id)

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Mark as read when fetching
    await markConversationRead(id, user.id)

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Error in GET /api/marketplace/conversations/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/marketplace/conversations/[id]
 * Update conversation (archive, etc.)
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
    const body = await request.json()
    const { action } = body

    if (action === 'archive') {
      const success = await archiveConversation(id, user.id)
      if (!success) {
        return NextResponse.json({ error: 'Failed to archive conversation' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'mark_read') {
      const success = await markConversationRead(id, user.id)
      if (!success) {
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in PATCH /api/marketplace/conversations/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
