import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import type { VecnaState } from '@/lib/vecna'

/**
 * GET /api/admin/vecna/[gameId]/state
 * Get the current Vecna processing state for a game
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { gameId } = await params
    const supabase = createAdminClient()

    const { data: game, error } = await supabase
      .from('games')
      .select(`
        id,
        name,
        vecna_state,
        vecna_processed_at,
        vecna_error,
        rulebook_url,
        wikipedia_url,
        wikipedia_external_links,
        wikidata_id,
        rules_content,
        setup_content,
        reference_content,
        is_published,
        crunch_score
      `)
      .eq('id', gameId)
      .single()

    if (error || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Calculate data availability flags
    const hasRulebook = !!game.rulebook_url
    const hasWikipedia = !!game.wikipedia_url
    const hasWikidata = !!game.wikidata_id
    const hasContent = !!game.rules_content
    const hasSetup = !!game.setup_content
    const hasReference = !!game.reference_content

    // Find potential rulebook URLs from Wikipedia
    const wikipediaRulebookLinks = Array.isArray(game.wikipedia_external_links)
      ? (game.wikipedia_external_links as Array<{ url: string; type: string }>).filter(
          (link) => link.type === 'rulebook'
        )
      : []

    return NextResponse.json({
      gameId: game.id,
      name: game.name,
      state: game.vecna_state || 'imported',
      processedAt: game.vecna_processed_at,
      error: game.vecna_error,
      data: {
        hasRulebook,
        hasWikipedia,
        hasWikidata,
        hasContent,
        hasSetup,
        hasReference,
        rulebookUrl: game.rulebook_url,
        wikipediaRulebookLinks,
        crunchScore: game.crunch_score,
        isPublished: game.is_published,
      },
    })
  } catch (error) {
    console.error('Vecna state error:', error)
    return NextResponse.json({ error: 'Failed to get state' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/vecna/[gameId]/state
 * Update the Vecna processing state for a game
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { gameId } = await params
    const body = await request.json()
    const { state, error: stateError, rulebookUrl } = body as {
      state?: VecnaState
      error?: string | null
      rulebookUrl?: string
    }

    const supabase = createAdminClient()

    // Build update object
    const updates: Record<string, unknown> = {
      vecna_processed_at: new Date().toISOString(),
    }

    if (state !== undefined) {
      updates.vecna_state = state

      // Publishing state also sets is_published on the game
      if (state === 'published') {
        updates.is_published = true
      }
      // Unpublishing (going back from published) clears is_published
      if (state === 'review_pending') {
        // Check if we're coming from published state
        const { data: currentGame } = await supabase
          .from('games')
          .select('vecna_state')
          .eq('id', gameId)
          .single()

        if (currentGame?.vecna_state === 'published') {
          updates.is_published = false
        }
      }
    }

    if (stateError !== undefined) {
      updates.vecna_error = stateError
    }

    // If setting rulebook URL, also update rulebook_url and transition state
    if (rulebookUrl !== undefined) {
      updates.rulebook_url = rulebookUrl
      updates.rulebook_source = 'manual'
      // If we were missing rulebook, now we're ready
      if (state === undefined) {
        const { data: currentGame } = await supabase
          .from('games')
          .select('vecna_state')
          .eq('id', gameId)
          .single()

        if (currentGame?.vecna_state === 'rulebook_missing') {
          updates.vecna_state = 'rulebook_ready'
        }
      }
    }

    const { data: game, error } = await supabase
      .from('games')
      .update(updates)
      .eq('id', gameId)
      .select('id, name, vecna_state, vecna_error')
      .single()

    if (error) {
      console.error('Failed to update state:', error)
      return NextResponse.json({ error: 'Failed to update state' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      gameId: game.id,
      name: game.name,
      state: game.vecna_state,
      error: game.vecna_error,
    })
  } catch (error) {
    console.error('Vecna state update error:', error)
    return NextResponse.json({ error: 'Failed to update state' }, { status: 500 })
  }
}
