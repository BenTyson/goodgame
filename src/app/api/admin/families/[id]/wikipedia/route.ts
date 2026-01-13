import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import {
  enrichFamilyFromWikipedia,
  linkGamesWithRelations,
  type MatchedGame,
} from '@/lib/wikipedia/family-enrichment'

/**
 * POST - Extract games from Wikipedia article
 * Fetches the Wikipedia article for a game in this family and extracts related games.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: familyId } = await params
    const supabase = createAdminClient()

    // Get the family
    const { data: family, error: familyError } = await supabase
      .from('game_families')
      .select('id, name')
      .eq('id', familyId)
      .single()

    if (familyError || !family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    // Get games in this family to find a Wikipedia URL
    const { data: games } = await supabase
      .from('games')
      .select('id, name, wikipedia_url, year_published')
      .eq('family_id', familyId)
      .not('wikipedia_url', 'is', null)
      .order('year_published', { ascending: true })

    if (!games || games.length === 0) {
      return NextResponse.json(
        { error: 'No games in this family have a Wikipedia URL' },
        { status: 400 }
      )
    }

    // Use the first game with a Wikipedia URL (usually the base game)
    const sourceGame = games[0]
    const wikipediaUrl = sourceGame.wikipedia_url!

    // Use shared enrichment function (but don't auto-link, let UI decide)
    const result = await enrichFamilyFromWikipedia(
      supabase,
      familyId,
      sourceGame.id,
      wikipediaUrl,
      { autoLinkHighConfidence: false, createRelations: false }
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sourceGame: result.sourceGame,
      extraction: result.extraction,
      matches: result.matches,
      usage: result.usage,
    })
  } catch (error) {
    console.error('Wikipedia enrichment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Link games to family and create relations
 * Links selected games to the family and creates game_relations entries.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: familyId } = await params
    const body = await request.json()

    // Support both old format (gameIds array) and new format (matches array with types)
    const { gameIds, matches, sourceGameId } = body as {
      gameIds?: string[]
      matches?: MatchedGame[]
      sourceGameId?: string
    }

    const supabase = createAdminClient()

    // If using new format with matches (includes relation types)
    if (matches && matches.length > 0 && sourceGameId) {
      const gamesToLink = matches
        .filter((m: MatchedGame) => m.matchedGame)
        .map((m: MatchedGame) => ({
          gameId: m.matchedGame!.id,
          relationType: m.extracted.type,
        }))

      const result = await linkGamesWithRelations(supabase, familyId, sourceGameId, gamesToLink)

      return NextResponse.json({
        success: true,
        linked: result.linked,
        relationsCreated: result.relationsCreated,
      })
    }

    // Fallback to old format (just gameIds, need to find source game)
    if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
      return NextResponse.json({ error: 'No game IDs provided' }, { status: 400 })
    }

    // Find source game (first game in family with Wikipedia URL, or just first)
    const { data: familyGames } = await supabase
      .from('games')
      .select('id')
      .eq('family_id', familyId)
      .order('year_published', { ascending: true })
      .limit(1)

    const targetGameId = sourceGameId || familyGames?.[0]?.id

    // Link games to family
    const { error } = await supabase.from('games').update({ family_id: familyId }).in('id', gameIds)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If we have a target game, create relations (for backwards compatibility)
    let relationsCreated = 0
    if (targetGameId) {
      for (const gameId of gameIds) {
        if (gameId === targetGameId) continue

        // Default to expansion_of for backwards compatibility
        await supabase.from('game_relations').upsert(
          {
            source_game_id: gameId,
            target_game_id: targetGameId,
            relation_type: 'expansion_of',
          },
          { onConflict: 'source_game_id,target_game_id,relation_type' }
        )
        relationsCreated++
      }
    }

    return NextResponse.json({
      success: true,
      linked: gameIds.length,
      relationsCreated,
    })
  } catch (error) {
    console.error('Link games error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
