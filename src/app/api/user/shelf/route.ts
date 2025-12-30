import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserShelf } from '@/lib/supabase/user-queries'
import type { ShelfStatus } from '@/types/database'

/**
 * GET /api/user/shelf
 * Get user's shelf items
 *
 * Query params:
 * - user_id: User ID (optional, defaults to current user)
 * - status: Filter by shelf status (owned, want_to_buy, etc.)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('user_id')
    const status = searchParams.get('status') as ShelfStatus | null

    // Determine which user's shelf to fetch
    let userId: string

    if (requestedUserId) {
      // Fetching another user's shelf - check visibility
      // For now, allow it (shelf visibility is handled at profile level)
      userId = requestedUserId
    } else if (user) {
      // Fetch current user's shelf
      userId = user.id
    } else {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const items = await getUserShelf(userId, {
      status: status || undefined,
      sortBy: 'name',
      sortOrder: 'asc',
    })

    // Transform to simpler format for API response
    const transformedItems = items.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      game_id: item.game_id,
      status: item.status,
      rating: item.rating,
      game: item.game ? {
        id: item.game.id,
        name: item.game.name,
        slug: item.game.slug,
        box_image_url: item.game.box_image_url,
        thumbnail_url: item.game.thumbnail_url,
      } : null,
    }))

    return NextResponse.json({ items: transformedItems })
  } catch (error) {
    console.error('Error in GET /api/user/shelf:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
