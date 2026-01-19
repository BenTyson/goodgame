import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  inviteFriendsToTable,
  isTableHost,
} from '@/lib/supabase/table-queries'
import { areFriends } from '@/lib/supabase/friend-queries'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * POST /api/tables/[id]/invite
 * Invite friends to a table (host only)
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

    // Verify user is the host
    const isHost = await isTableHost(tableId, user.id)
    if (!isHost) {
      return NextResponse.json({ error: 'Only the host can invite people' }, { status: 403 })
    }

    const body = await request.json()
    const { userIds } = body as { userIds: string[] }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'No users to invite' }, { status: 400 })
    }

    // Verify all users are friends (mutual follows)
    const friendChecks = await Promise.all(
      userIds.map(async (userId) => ({
        userId,
        isFriend: await areFriends(user.id, userId),
      }))
    )

    const nonFriends = friendChecks.filter((check) => !check.isFriend)
    if (nonFriends.length > 0) {
      return NextResponse.json(
        { error: 'You can only invite friends (mutual follows)', nonFriends: nonFriends.map((f) => f.userId) },
        { status: 400 }
      )
    }

    // Invite the friends
    const result = await inviteFriendsToTable(tableId, userIds, user.id)

    return NextResponse.json({
      success: result.success,
      failed: result.failed,
      message: result.failed > 0
        ? `Invited ${result.success} friends, ${result.failed} already invited or had errors`
        : `Invited ${result.success} friends`,
    })
  } catch (error) {
    console.error('Error inviting friends:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
