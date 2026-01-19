import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteTableComment, isTableHost } from '@/lib/supabase/table-queries'

interface RouteContext {
  params: Promise<{ id: string; commentId: string }>
}

// DELETE /api/tables/[id]/comments/[commentId] - Delete a comment
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id: tableId, commentId } = await context.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  // Get the comment to check ownership
  // Note: table_comments will be in types after migration is applied
  const { data: comment, error: fetchError } = await supabase
    .from('table_comments' as 'games')
    .select('user_id')
    .eq('id', commentId)
    .eq('table_id' as 'id', tableId)
    .single() as { data: { user_id: string } | null; error: Error | null }

  if (fetchError || !comment) {
    return NextResponse.json(
      { error: 'Comment not found' },
      { status: 404 }
    )
  }

  // Check if user can delete (owner or host)
  const isOwner = comment.user_id === user.id
  const isHost = await isTableHost(tableId, user.id)

  if (!isOwner && !isHost) {
    return NextResponse.json(
      { error: 'Not authorized to delete this comment' },
      { status: 403 }
    )
  }

  try {
    const success = await deleteTableComment(commentId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
