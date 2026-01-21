import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

import { createClient } from '@/lib/supabase/server'
import {
  getGameRequestCount,
  hasUserRequested,
  hasIpRequested,
  createContentRequest,
} from '@/lib/supabase/request-queries'

/**
 * Hash an IP address for privacy-preserving deduplication
 */
function hashIP(ip: string): string {
  return createHash('sha256')
    .update(ip + process.env.IP_HASH_SALT || 'goodgame-content-requests')
    .digest('hex')
    .slice(0, 64)
}

/**
 * Get the client IP from request headers
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || '127.0.0.1'
}

/**
 * GET /api/games/[gameId]/content-request
 * Returns the current request count and whether the user has requested
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params

  if (!gameId) {
    return NextResponse.json({ error: 'Game ID required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const requestCount = await getGameRequestCount(gameId)

    let hasRequested = false
    if (user) {
      hasRequested = await hasUserRequested(gameId, user.id)
    } else {
      // For anonymous users, check by IP hash
      const ipHash = hashIP(getClientIP(request))
      hasRequested = await hasIpRequested(gameId, ipHash)
    }

    return NextResponse.json({
      requestCount,
      hasRequested,
    })
  } catch (error) {
    console.error('Error getting content request state:', error)
    return NextResponse.json(
      { error: 'Failed to get request state' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/games/[gameId]/content-request
 * Submits a content request for the game
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const { gameId } = await params

  if (!gameId) {
    return NextResponse.json({ error: 'Game ID required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const ipHash = hashIP(getClientIP(request))

    // Create the request
    const result = await createContentRequest(
      gameId,
      user?.id,
      ipHash
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create request' },
        { status: 400 }
      )
    }

    // Get updated count
    const requestCount = await getGameRequestCount(gameId)

    return NextResponse.json({
      success: true,
      requestCount,
    })
  } catch (error) {
    console.error('Error creating content request:', error)
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    )
  }
}
