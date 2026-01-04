import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generate } from '@/lib/ai/claude'
import type { RelationType } from '@/types/database'

interface GameInfo {
  id: string
  name: string
  year_published: number | null
  bgg_id: number | null
}

interface ExtractedRelation {
  sourceName: string
  targetName: string
  relationType: 'expansion_of' | 'sequel_to' | 'reimplementation_of' | 'spin_off_of' | 'standalone_in_series'
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

interface MatchedRelation {
  sourceGame: GameInfo
  targetGame: GameInfo
  relationType: RelationType
  confidence: 'high' | 'medium' | 'low'
  reason: string
  alreadyExists: boolean
}

const RELATION_EXTRACTION_PROMPT = `You are an expert at analyzing board game relationships from Wikipedia articles.

Given a list of games in a family and the Wikipedia article content, determine the relationships between them.

IMPORTANT: Focus on identifying what type of relation each game has and to which specific game it relates.

Relation types (use these exact values):
- expansion_of: An expansion that requires the base game to play
- sequel_to: A standalone sequel (new game in the series, doesn't require original)
- reimplementation_of: A new version/edition with significant rule changes
- spin_off_of: A game set in the same universe but different gameplay
- standalone_in_series: Part of the series but can be played alone

Return a JSON array of relationships:
[
  {
    "sourceName": "Gloomhaven: Forgotten Circles",
    "targetName": "Gloomhaven",
    "relationType": "expansion_of",
    "confidence": "high",
    "reason": "Expansion mentioned in Wikipedia requiring base game"
  },
  {
    "sourceName": "Frosthaven",
    "targetName": "Gloomhaven",
    "relationType": "sequel_to",
    "confidence": "high",
    "reason": "Described as standalone sequel in Wikipedia"
  }
]

Guidelines:
- sourceName is the game that HAS the relation (e.g., the expansion)
- targetName is the game it relates TO (e.g., the base game)
- Use exact game names from the provided list when possible
- Only include relationships you can determine from the Wikipedia content
- Set confidence based on how clear the relationship is in the article
- For games not mentioned in Wikipedia, use your knowledge but mark as "medium" confidence
- Return ONLY valid JSON array, no markdown or explanation`

/**
 * Fetch Wikipedia article content using the MediaWiki API
 */
async function fetchWikipediaContent(wikipediaUrl: string): Promise<string> {
  const urlMatch = wikipediaUrl.match(/\/wiki\/(.+)$/)
  if (!urlMatch) {
    throw new Error('Invalid Wikipedia URL format')
  }

  const articleTitle = decodeURIComponent(urlMatch[1])
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(articleTitle)}&prop=extracts&explaintext=true&format=json&origin=*`

  const response = await fetch(apiUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch Wikipedia article: ${response.status}`)
  }

  const data = await response.json()
  const pages = data.query?.pages
  if (!pages) {
    throw new Error('No pages found in Wikipedia response')
  }

  const pageId = Object.keys(pages)[0]
  const page = pages[pageId]

  if (page.missing !== undefined) {
    throw new Error(`Wikipedia article not found: ${articleTitle}`)
  }

  return page.extract || ''
}

/**
 * Normalize game name for matching
 */
function normalizeForMatching(name: string): string {
  return name
    .toLowerCase()
    .replace(/[:\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
}

/**
 * Find the best matching game from our list
 */
function findBestMatch(name: string, games: GameInfo[]): GameInfo | null {
  const normalized = normalizeForMatching(name)

  // Exact match first
  for (const game of games) {
    if (normalizeForMatching(game.name) === normalized) {
      return game
    }
  }

  // Fuzzy match - contains
  for (const game of games) {
    const gameNorm = normalizeForMatching(game.name)
    if (gameNorm.includes(normalized) || normalized.includes(gameNorm)) {
      const overlap = Math.min(gameNorm.length, normalized.length) / Math.max(gameNorm.length, normalized.length)
      if (overlap > 0.5) {
        return game
      }
    }
  }

  return null
}

/**
 * POST - Analyze unlinked games and suggest relations
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: familyId } = await params
    const supabase = createAdminClient()

    // Get all games in this family
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, name, year_published, bgg_id, wikipedia_url')
      .eq('family_id', familyId)
      .order('year_published', { ascending: true, nullsFirst: false })

    if (gamesError || !games || games.length === 0) {
      return NextResponse.json({ error: 'No games found in family' }, { status: 400 })
    }

    // Get existing relations within the family
    const gameIds = games.map(g => g.id)
    const { data: existingRelations } = await supabase
      .from('game_relations')
      .select('source_game_id, target_game_id, relation_type')
      .in('source_game_id', gameIds)
      .in('target_game_id', gameIds)

    // Find games with Wikipedia URLs
    const gamesWithWiki = games.filter(g => g.wikipedia_url)
    if (gamesWithWiki.length === 0) {
      return NextResponse.json(
        { error: 'No games in this family have a Wikipedia URL' },
        { status: 400 }
      )
    }

    // Fetch Wikipedia content from the first game (usually base game)
    const sourceGame = gamesWithWiki[0]
    const wikiContent = await fetchWikipediaContent(sourceGame.wikipedia_url!)

    if (!wikiContent || wikiContent.length < 100) {
      return NextResponse.json(
        { error: 'Wikipedia article content too short or empty' },
        { status: 400 }
      )
    }

    // Truncate content if too long
    const truncatedContent = wikiContent.length > 15000
      ? wikiContent.slice(0, 15000) + '\n\n[Content truncated...]'
      : wikiContent

    // Create game list for the prompt
    const gameList = games.map(g =>
      `- "${g.name}" (${g.year_published || 'year unknown'})`
    ).join('\n')

    // Parse with Haiku
    const result = await generate(
      RELATION_EXTRACTION_PROMPT,
      `Games in this family:\n${gameList}\n\nWikipedia article for "${sourceGame.name}":\n\n${truncatedContent}`,
      { temperature: 0.3 }
    )

    // Parse the AI response
    let extractedRelations: ExtractedRelation[]
    try {
      let jsonStr = result.content.trim()
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }
      extractedRelations = JSON.parse(jsonStr)
    } catch {
      console.error('Failed to parse AI response:', result.content)
      return NextResponse.json(
        { error: 'Failed to parse relation extraction' },
        { status: 500 }
      )
    }

    // Match extracted relations to our games
    const matchedRelations: MatchedRelation[] = []
    const existingRelationSet = new Set(
      (existingRelations || []).map(r =>
        `${r.source_game_id}-${r.target_game_id}-${r.relation_type}`
      )
    )

    for (const rel of extractedRelations) {
      const sourceGame = findBestMatch(rel.sourceName, games)
      const targetGame = findBestMatch(rel.targetName, games)

      if (sourceGame && targetGame && sourceGame.id !== targetGame.id) {
        const alreadyExists = existingRelationSet.has(
          `${sourceGame.id}-${targetGame.id}-${rel.relationType}`
        )

        matchedRelations.push({
          sourceGame: {
            id: sourceGame.id,
            name: sourceGame.name,
            year_published: sourceGame.year_published,
            bgg_id: sourceGame.bgg_id,
          },
          targetGame: {
            id: targetGame.id,
            name: targetGame.name,
            year_published: targetGame.year_published,
            bgg_id: targetGame.bgg_id,
          },
          relationType: rel.relationType as RelationType,
          confidence: rel.confidence,
          reason: rel.reason,
          alreadyExists,
        })
      }
    }

    // Separate new vs existing relations
    const newRelations = matchedRelations.filter(r => !r.alreadyExists)
    const existingMatched = matchedRelations.filter(r => r.alreadyExists)

    return NextResponse.json({
      success: true,
      sourceArticle: {
        name: sourceGame.name,
        url: sourceGame.wikipedia_url,
      },
      relations: {
        new: newRelations,
        existing: existingMatched,
      },
      stats: {
        totalGames: games.length,
        extractedRelations: extractedRelations.length,
        matchedNew: newRelations.length,
        matchedExisting: existingMatched.length,
      },
      usage: {
        model: result.model,
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        costUsd: result.costUsd,
      },
    })

  } catch (error) {
    console.error('Auto-link error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Create the suggested relations
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: familyId } = await params
    const { relations } = await request.json()

    if (!relations || !Array.isArray(relations) || relations.length === 0) {
      return NextResponse.json({ error: 'No relations provided' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify all games belong to this family
    const gameIds = new Set<string>()
    for (const rel of relations) {
      gameIds.add(rel.sourceGameId)
      gameIds.add(rel.targetGameId)
    }

    const { data: games } = await supabase
      .from('games')
      .select('id')
      .eq('family_id', familyId)
      .in('id', Array.from(gameIds))

    if (!games || games.length !== gameIds.size) {
      return NextResponse.json(
        { error: 'Some games do not belong to this family' },
        { status: 400 }
      )
    }

    // Create the relations
    const relationsToInsert = relations.map((rel: { sourceGameId: string; targetGameId: string; relationType: RelationType }) => ({
      source_game_id: rel.sourceGameId,
      target_game_id: rel.targetGameId,
      relation_type: rel.relationType,
    }))

    const { error } = await supabase
      .from('game_relations')
      .upsert(relationsToInsert, {
        onConflict: 'source_game_id,target_game_id,relation_type',
        ignoreDuplicates: true,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      created: relations.length,
    })

  } catch (error) {
    console.error('Create relations error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
