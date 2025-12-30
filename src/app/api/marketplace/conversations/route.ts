import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getUserConversations,
  getOrCreateConversation,
} from '@/lib/supabase/conversation-queries'

/**
 * GET /api/marketplace/conversations
 * Get all conversations for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversations = await getUserConversations(user.id)
    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error in GET /api/marketplace/conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/marketplace/conversations
 * Start a new conversation about a listing
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { listing_id } = body

    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id is required' }, { status: 400 })
    }

    const conversationId = await getOrCreateConversation(listing_id, user.id)

    if (!conversationId) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    return NextResponse.json({ conversation_id: conversationId })
  } catch (error) {
    console.error('Error in POST /api/marketplace/conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
