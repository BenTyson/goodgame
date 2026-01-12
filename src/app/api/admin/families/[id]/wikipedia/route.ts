import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generate } from '@/lib/ai/claude'

interface WikipediaExtraction {
  description: string | null
  expansions: ExtractedGame[]
  sequels: ExtractedGame[]
  spinoffs: ExtractedGame[]
  relatedGames: ExtractedGame[]
}

interface ExtractedGame {
  name: string
  bggId: number | null
  year: number | null
  type: 'expansion' | 'sequel' | 'spinoff' | 'standalone' | 'related'
  notes: string | null
}

interface MatchedGame {
  extracted: ExtractedGame
  matchedGame: {
    id: string
    name: string
    bgg_id: number | null
    family_id: string | null
    slug: string
  } | null
  matchType: 'exact' | 'fuzzy' | 'bgg_id' | 'none'
  alreadyInFamily: boolean
}

const WIKIPEDIA_EXTRACTION_PROMPT = `You are an expert at extracting structured game data from Wikipedia articles about board games.

Analyze the Wikipedia article content and extract information about related games in this family/series.

Return a JSON object with this structure:
{
  "description": "A 2-3 sentence summary of the game series/family",
  "expansions": [
    { "name": "Expansion Name", "bggId": null, "year": 2020, "type": "expansion", "notes": "Brief note if relevant" }
  ],
  "sequels": [
    { "name": "Sequel Name", "bggId": null, "year": 2022, "type": "sequel", "notes": null }
  ],
  "spinoffs": [
    { "name": "Spinoff Name", "bggId": null, "year": 2021, "type": "spinoff", "notes": null }
  ],
  "relatedGames": [
    { "name": "Related Game", "bggId": null, "year": null, "type": "related", "notes": "How it's related" }
  ]
}

Guidelines:
- Extract ALL games mentioned that are related to the main game
- Categorize them as: expansion (adds to base game), sequel (follows chronologically), spinoff (same universe, different game), related (reimplementation, inspired by, etc.)
- Include year if mentioned
- If a BGG ID is mentioned or can be inferred from links, include it
- Include the base game itself in the appropriate category if mentioned
- Be thorough - don't miss any games mentioned in sections like "Expansions", "Sequels", "Related games", "Reception", etc.
- Return ONLY valid JSON, no markdown or explanation`

/**
 * Fetch Wikipedia article content using the MediaWiki API
 */
async function fetchWikipediaContent(wikipediaUrl: string): Promise<string> {
  // Extract article title from URL
  // e.g., https://en.wikipedia.org/wiki/Gloomhaven -> Gloomhaven
  const urlMatch = wikipediaUrl.match(/\/wiki\/(.+)$/)
  if (!urlMatch) {
    throw new Error('Invalid Wikipedia URL format')
  }

  const articleTitle = decodeURIComponent(urlMatch[1])

  // Use MediaWiki API to get article content as plain text
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

  // Get the first (and should be only) page
  const pageId = Object.keys(pages)[0]
  const page = pages[pageId]

  if (page.missing !== undefined) {
    throw new Error(`Wikipedia article not found: ${articleTitle}`)
  }

  return page.extract || ''
}

/**
 * Normalize game name for fuzzy matching
 */
function normalizeGameName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[:\-–—]/g, ' ')
    .replace(/\s*&\s*/g, ' and ')  // Normalize & to "and"
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
}

/**
 * Match extracted games to games in our database
 */
async function matchGamesToDatabase(
  extracted: ExtractedGame[],
  familyId: string,
  familyName: string
): Promise<MatchedGame[]> {
  const supabase = createAdminClient()

  // Get all games for potential matching
  const { data: allGames } = await supabase
    .from('games')
    .select('id, name, bgg_id, family_id, slug')

  if (!allGames) return []

  // Create lookup maps
  const gamesByNormalizedName = new Map<string, typeof allGames[0]>()
  const gamesByBggId = new Map<number, typeof allGames[0]>()

  for (const game of allGames) {
    gamesByNormalizedName.set(normalizeGameName(game.name), game)
    if (game.bgg_id) {
      gamesByBggId.set(game.bgg_id, game)
    }
  }

  // Normalize family name for prefix matching
  const normalizedFamilyName = normalizeGameName(familyName)

  const results: MatchedGame[] = []

  for (const ext of extracted) {
    let matchedGame: typeof allGames[0] | null = null
    let matchType: MatchedGame['matchType'] = 'none'

    // Try BGG ID match first (most reliable)
    if (ext.bggId && gamesByBggId.has(ext.bggId)) {
      matchedGame = gamesByBggId.get(ext.bggId)!
      matchType = 'bgg_id'
    }

    // Try exact normalized name match
    if (!matchedGame) {
      const normalized = normalizeGameName(ext.name)
      if (gamesByNormalizedName.has(normalized)) {
        matchedGame = gamesByNormalizedName.get(normalized)!
        matchType = 'exact'
      }
    }

    // Try family prefix match (e.g., "Branch & Claw" → "Spirit Island: Branch & Claw")
    if (!matchedGame) {
      const normalized = normalizeGameName(ext.name)
      // Try "Family Name: Extracted Name" and "Family Name Extracted Name"
      const prefixedVariants = [
        `${normalizedFamilyName} ${normalized}`,
      ]
      for (const variant of prefixedVariants) {
        if (gamesByNormalizedName.has(variant)) {
          matchedGame = gamesByNormalizedName.get(variant)!
          matchType = 'fuzzy'
          break
        }
      }
    }

    // Try suffix match (check if any game name ends with the extracted name after the family prefix)
    if (!matchedGame) {
      const normalized = normalizeGameName(ext.name)
      for (const [gameName, game] of gamesByNormalizedName) {
        // Check if the game name starts with family name and ends with extracted name
        if (gameName.startsWith(normalizedFamilyName) && gameName.endsWith(normalized)) {
          matchedGame = game
          matchType = 'fuzzy'
          break
        }
      }
    }

    // Try fuzzy match (contains) with reasonable overlap
    if (!matchedGame) {
      const normalized = normalizeGameName(ext.name)
      for (const [gameName, game] of gamesByNormalizedName) {
        if (gameName.includes(normalized) || normalized.includes(gameName)) {
          // Only accept if it's a substantial match (>50% overlap)
          const overlap = Math.min(gameName.length, normalized.length) / Math.max(gameName.length, normalized.length)
          if (overlap > 0.5) {
            matchedGame = game
            matchType = 'fuzzy'
            break
          }
        }
      }
    }

    results.push({
      extracted: ext,
      matchedGame: matchedGame ? {
        id: matchedGame.id,
        name: matchedGame.name,
        bgg_id: matchedGame.bgg_id,
        family_id: matchedGame.family_id,
        slug: matchedGame.slug,
      } : null,
      matchType,
      alreadyInFamily: matchedGame?.family_id === familyId,
    })
  }

  return results
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: familyId } = await params
    const supabase = createAdminClient()

    // Get the family and its games
    const { data: family, error: familyError } = await supabase
      .from('game_families')
      .select('id, name, wikidata_series_id')
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

    // Fetch Wikipedia content
    const wikiContent = await fetchWikipediaContent(wikipediaUrl)

    if (!wikiContent || wikiContent.length < 100) {
      return NextResponse.json(
        { error: 'Wikipedia article content too short or empty' },
        { status: 400 }
      )
    }

    // Truncate content if too long (keep first ~15000 chars for context)
    const truncatedContent = wikiContent.length > 15000
      ? wikiContent.slice(0, 15000) + '\n\n[Content truncated...]'
      : wikiContent

    // Parse with Haiku
    const result = await generate(
      WIKIPEDIA_EXTRACTION_PROMPT,
      `Wikipedia article for "${sourceGame.name}":\n\n${truncatedContent}`,
      { temperature: 0.3 }
    )

    // Parse the AI response
    let extraction: WikipediaExtraction
    try {
      // Clean up the response - remove markdown code blocks if present
      let jsonStr = result.content.trim()
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }
      extraction = JSON.parse(jsonStr)
    } catch {
      console.error('Failed to parse AI response:', result.content)
      return NextResponse.json(
        { error: 'Failed to parse Wikipedia extraction' },
        { status: 500 }
      )
    }

    // Combine all extracted games
    const allExtracted: ExtractedGame[] = [
      ...extraction.expansions,
      ...extraction.sequels,
      ...extraction.spinoffs,
      ...extraction.relatedGames,
    ]

    // Match to our database
    const matchedGames = await matchGamesToDatabase(allExtracted, familyId, family.name)

    // Categorize results
    const inFamily = matchedGames.filter(m => m.alreadyInFamily)
    const canLink = matchedGames.filter(m => m.matchedGame && !m.alreadyInFamily)
    const notInDb = matchedGames.filter(m => !m.matchedGame)

    return NextResponse.json({
      success: true,
      sourceGame: {
        id: sourceGame.id,
        name: sourceGame.name,
        wikipediaUrl,
      },
      extraction: {
        description: extraction.description,
        totalFound: allExtracted.length,
      },
      matches: {
        inFamily,
        canLink,
        notInDb,
      },
      usage: {
        model: result.model,
        tokensInput: result.tokensInput,
        tokensOutput: result.tokensOutput,
        costUsd: result.costUsd,
      },
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
 * Link games to family
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: familyId } = await params
    const { gameIds } = await request.json()

    if (!gameIds || !Array.isArray(gameIds) || gameIds.length === 0) {
      return NextResponse.json({ error: 'No game IDs provided' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Update all games to link to this family
    const { error } = await supabase
      .from('games')
      .update({ family_id: familyId })
      .in('id', gameIds)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      linked: gameIds.length,
    })

  } catch (error) {
    console.error('Link games error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
