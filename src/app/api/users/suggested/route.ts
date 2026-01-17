import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getSuggestedFriends,
  getFriendsOfFriends,
  getRecentlyActiveUsers,
} from '@/lib/supabase/friend-queries'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type') || 'mutual-games'
  const userId = searchParams.get('userId')
  const limit = parseInt(searchParams.get('limit') || '10', 10)

  // For non-recently-active types, userId is required
  if (type !== 'recently-active' && !userId) {
    return NextResponse.json(
      { error: 'userId is required for this suggestion type' },
      { status: 400 }
    )
  }

  try {
    let users

    switch (type) {
      case 'mutual-games':
        users = await getSuggestedFriends(userId!, limit)
        break
      case 'friends-of-friends':
        users = await getFriendsOfFriends(userId!, limit)
        break
      case 'recently-active':
        // For recently active, we can show to non-logged-in users too
        // but use a server-side query to get public users
        if (userId) {
          users = await getRecentlyActiveUsers(userId, limit)
        } else {
          users = await getRecentlyActivePublicUsers(limit)
        }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid suggestion type' },
          { status: 400 }
        )
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching suggested users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}

// Get recently active public users (for non-logged-in users)
async function getRecentlyActivePublicUsers(limit: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url, custom_avatar_url, bio, last_active_at')
    .eq('profile_visibility', 'public')
    .not('last_active_at', 'is', null)
    .order('last_active_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recently active users:', error)
    return []
  }

  return (data || []).map((row) => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    customAvatarUrl: row.custom_avatar_url,
    bio: row.bio,
    lastActiveAt: row.last_active_at,
    recentActivitySummary: 'Recently active',
  }))
}
