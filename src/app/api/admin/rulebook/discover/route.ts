import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { discoverRulebookWithFallback, getPublisherResourcePage } from '@/lib/rulebook'

/**
 * POST /api/admin/rulebook/discover
 * Auto-discover rulebook URL for a game based on publisher patterns
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { gameId, gameName, publisher } = body

    if (!gameName || typeof gameName !== 'string') {
      return NextResponse.json({ error: 'Game name required' }, { status: 400 })
    }

    // Try to get publisher website from database if we have a gameId
    let publisherWebsite: string | undefined
    let publisherName = publisher

    if (gameId) {
      const supabase = createAdminClient()

      // Get the primary publisher for this game
      const { data: gamePublishers } = await supabase
        .from('game_publishers')
        .select(`
          publisher_id,
          is_primary,
          publishers (
            id,
            name,
            website
          )
        `)
        .eq('game_id', gameId)
        .order('is_primary', { ascending: false })
        .limit(1)

      if (gamePublishers && gamePublishers.length > 0) {
        const pub = gamePublishers[0].publishers as { id: string; name: string; website: string | null } | null
        if (pub) {
          publisherName = pub.name
          publisherWebsite = pub.website || undefined
        }
      }
    }

    // Try to discover rulebook URL (now with publisher website and web search fallback)
    const result = await discoverRulebookWithFallback(
      gameName,
      publisherName,
      publisherWebsite,
      true // Enable web search fallback
    )

    // If not found but we have a publisher, suggest their resource page
    if (!result.found && publisherName) {
      const resourcePage = getPublisherResourcePage(publisherName)
      if (resourcePage) {
        return NextResponse.json({
          ...result,
          notes: `Check ${publisherName}'s resource page: ${resourcePage}`,
          publisherWebsite: publisherWebsite || null,
        })
      }
    }

    return NextResponse.json({
      ...result,
      publisherWebsite: publisherWebsite || null,
    })
  } catch (error) {
    console.error('Rulebook discovery error:', error)
    return NextResponse.json(
      { found: false, error: 'Discovery failed' },
      { status: 500 }
    )
  }
}
