import { NextRequest, NextResponse } from 'next/server'
import { searchUsers } from '@/lib/supabase/friend-queries'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const userId = searchParams.get('userId')
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    )
  }

  try {
    const users = await searchUsers(query, userId || undefined, limit)
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    )
  }
}
