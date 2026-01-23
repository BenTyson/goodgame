import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { discoverRulebookWithFallback, validateRulebookUrl } from '@/lib/rulebook'

interface WikipediaExternalLink {
  url: string
  type: string
  domain?: string
}

interface RulebookCandidate {
  url: string
  source: 'wikidata' | 'wikipedia' | 'publisher_pattern' | 'web_search'
  confidence: 'high' | 'medium' | 'low'
  label?: string
  validated?: boolean
}

/**
 * POST /api/admin/vecna/[gameId]/discover-rulebook
 *
 * Discover rulebook URLs for a game using the priority chain:
 * 1. Wikidata P953 (rulebook URL property) - Already in games.rulebook_url if from Wikidata
 * 2. Wikipedia external links (type: 'rulebook')
 * 3. Publisher website pattern matching
 * 4. Web search suggestion
 */
export async function POST(
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
    const { validate = true } = body as { validate?: boolean }

    const supabase = createAdminClient()

    // Get game with all relevant data for discovery
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(`
        id,
        name,
        slug,
        rulebook_url,
        rulebook_source,
        wikipedia_url,
        wikipedia_external_links,
        wikidata_id,
        official_website
      `)
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Get primary publisher
    const { data: publishers } = await supabase
      .from('game_publishers')
      .select(`
        is_primary,
        publishers (
          name,
          website
        )
      `)
      .eq('game_id', gameId)
      .order('is_primary', { ascending: false })
      .limit(1)

    const primaryPublisher = publishers?.[0]?.publishers as { name: string; website: string | null } | null
    const publisherName = primaryPublisher?.name
    const publisherWebsite = primaryPublisher?.website || game.official_website

    const candidates: RulebookCandidate[] = []

    // Priority 1: Check if Wikidata already provided a rulebook URL
    if (game.rulebook_url && game.rulebook_source === 'wikidata') {
      const validated = validate ? await validateRulebookUrl(game.rulebook_url) : { valid: true }
      candidates.push({
        url: game.rulebook_url,
        source: 'wikidata',
        confidence: 'high',
        label: 'Wikidata P953 (Official rulebook property)',
        validated: validated.valid,
      })
    }

    // Priority 2: Check Wikipedia external links for rulebook type
    if (game.wikipedia_external_links && Array.isArray(game.wikipedia_external_links)) {
      const rulebookLinks = (game.wikipedia_external_links as unknown as WikipediaExternalLink[]).filter(
        (link) => link.type === 'rulebook'
      )

      for (const link of rulebookLinks) {
        // Skip if same as Wikidata URL
        if (link.url === game.rulebook_url) continue

        const validated = validate ? await validateRulebookUrl(link.url) : { valid: true }
        candidates.push({
          url: link.url,
          source: 'wikipedia',
          confidence: validated.valid ? 'high' : 'medium',
          label: `Wikipedia external link (${link.domain || 'unknown domain'})`,
          validated: validated.valid,
        })
      }
    }

    // Priority 3: Publisher pattern matching
    if (publisherName || publisherWebsite) {
      const patternResult = await discoverRulebookWithFallback(
        game.name,
        publisherName || undefined,
        publisherWebsite || undefined,
        false // Don't include web search here
      )

      if (patternResult.found && patternResult.url) {
        // Skip if already in candidates
        const alreadyExists = candidates.some((c) => c.url === patternResult.url)
        if (!alreadyExists) {
          const validated = validate ? await validateRulebookUrl(patternResult.url) : { valid: true }
          candidates.push({
            url: patternResult.url,
            source: 'publisher_pattern',
            confidence: validated.valid
              ? (patternResult.confidence as 'high' | 'medium' | 'low')
              : 'low',
            label: patternResult.notes,
            validated: validated.valid,
          })
        }
      }
    }

    // Priority 4: Web search suggestion (always last, just provides query)
    const searchQuery = publisherName
      ? `"${game.name}" "${publisherName}" official rulebook PDF`
      : `"${game.name}" board game official rulebook PDF`

    // Determine best candidate
    const validCandidates = candidates.filter((c) => c.validated !== false)
    const bestCandidate = validCandidates[0] || null

    // If we found a good candidate and current rulebook is empty, suggest auto-setting
    const canAutoSet = bestCandidate && !game.rulebook_url && bestCandidate.confidence === 'high'

    return NextResponse.json({
      gameId: game.id,
      gameName: game.name,
      currentRulebookUrl: game.rulebook_url,
      currentSource: game.rulebook_source,
      candidates,
      bestCandidate,
      canAutoSet,
      searchQuery,
      publisherInfo: {
        name: publisherName,
        website: publisherWebsite,
      },
    })
  } catch (error) {
    console.error('Rulebook discovery error:', error)
    return NextResponse.json({ error: 'Discovery failed' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/vecna/[gameId]/discover-rulebook
 * Set or clear the rulebook URL for a game
 *
 * Pass { url: null } to clear the rulebook and reset the game state
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
    const { url, source } = body as { url: string | null; source?: string }

    const supabase = createAdminClient()

    // Handle clearing the rulebook (url = null)
    if (url === null) {
      const { data: game, error } = await supabase
        .from('games')
        .update({
          rulebook_url: null,
          rulebook_source: null,
          vecna_state: 'enriched', // Reset to enriched state
          vecna_processed_at: new Date().toISOString(),
          vecna_error: null,
        })
        .eq('id', gameId)
        .select('id, name, rulebook_url, vecna_state')
        .single()

      if (error) {
        console.error('Failed to clear rulebook URL:', error)
        return NextResponse.json({ error: 'Failed to clear rulebook' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        gameId: game.id,
        name: game.name,
        rulebookUrl: game.rulebook_url,
        state: game.vecna_state,
        cleared: true,
      })
    }

    // Setting a URL - validate it
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    // Validate URL before setting
    const validation = await validateRulebookUrl(url)
    if (!validation.valid) {
      return NextResponse.json({
        error: 'Invalid rulebook URL',
        details: validation.error,
      }, { status: 400 })
    }

    // Map source to rulebook_source enum
    const sourceMap: Record<string, string> = {
      wikidata: 'wikidata',
      wikipedia: 'manual', // Wikipedia links are treated as manual since user selected
      publisher_pattern: 'publisher_website',
      manual: 'manual',
    }

    const { data: game, error } = await supabase
      .from('games')
      .update({
        rulebook_url: url,
        rulebook_source: sourceMap[source || 'manual'] || 'manual',
        vecna_state: 'rulebook_ready',
        vecna_processed_at: new Date().toISOString(),
        vecna_error: null,
      })
      .eq('id', gameId)
      .select('id, name, rulebook_url, vecna_state')
      .single()

    if (error) {
      console.error('Failed to set rulebook URL:', error)
      return NextResponse.json({ error: 'Failed to set URL' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      gameId: game.id,
      name: game.name,
      rulebookUrl: game.rulebook_url,
      state: game.vecna_state,
    })
  } catch (error) {
    console.error('Set rulebook error:', error)
    return NextResponse.json({ error: 'Failed to set rulebook' }, { status: 500 })
  }
}
