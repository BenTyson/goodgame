import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getTableComments,
  createTableComment,
  isTableParticipant,
} from '@/lib/supabase/table-queries'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/tables/[id]/comments - Get all comments for a table
export async function GET(request: NextRequest, context: RouteContext) {
  const { id: tableId } = await context.params

  try {
    const supabase = await createClient()
    const comments = await getTableComments(tableId, supabase)

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/tables/[id]/comments - Create a new comment
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

  // Check if user is a participant
  const isParticipant = await isTableParticipant(tableId, user.id)
  if (!isParticipant) {
    return NextResponse.json(
      { error: 'Only participants can comment' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { content, parentId } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    const comment = await createTableComment(
      tableId,
      user.id,
      content.trim(),
      parentId
    )

    if (!comment) {
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
