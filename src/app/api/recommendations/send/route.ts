import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { areFriends } from '@/lib/supabase/friend-queries'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { gameId, recipientIds, message } = body

    if (!gameId || !recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json(
        { error: 'gameId and recipientIds are required' },
        { status: 400 }
      )
    }

    // Limit to 10 recipients at once
    if (recipientIds.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 recipients per request' },
        { status: 400 }
      )
    }

    // Verify the game exists
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, name')
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    // Verify all recipients are friends
    const friendChecks = await Promise.all(
      recipientIds.map(async (recipientId: string) => {
        const isFriend = await areFriends(user.id, recipientId)
        return { recipientId, isFriend }
      })
    )

    const nonFriends = friendChecks.filter(c => !c.isFriend)
    if (nonFriends.length > 0) {
      return NextResponse.json(
        { error: 'Can only recommend to friends' },
        { status: 403 }
      )
    }

    // Create notifications for each recipient
    // Note: 'game_recommendation' type is added via migration 00078
    // After running migration, regenerate types with: npx supabase gen types typescript --linked
    const notifications = recipientIds.map((recipientId: string) => ({
      user_id: recipientId,
      notification_type: 'game_recommendation',
      actor_id: user.id,
      game_id: gameId,
      metadata: message ? { message } : {},
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await supabase
      .from('user_notifications')
      .insert(notifications as any)

    if (insertError) {
      console.error('Error creating notifications:', insertError)
      return NextResponse.json(
        { error: 'Failed to send recommendations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: recipientIds.length,
    })
  } catch (error) {
    console.error('Error sending recommendations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
