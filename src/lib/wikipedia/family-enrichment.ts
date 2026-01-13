/**
 * Wikipedia Family Enrichment
 *
 * Extracts related games from Wikipedia articles and creates game_relations entries.
 * Used both by the manual enrichment button and automatic enrichment during import.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { generate } from '@/lib/ai/claude'
import type { Database } from '@/types/supabase'
import type { RelationType } from '@/types/database'

// =====================================================
// Types
// =====================================================

export interface WikipediaExtraction {
  description: string | null
  expansions: ExtractedGame[]
  sequels: ExtractedGame[]
  spinoffs: ExtractedGame[]
  relatedGames: ExtractedGame[]
}

export interface ExtractedGame {
  name: string
  bggId: number | null
  year: number | null
  type: 'expansion' | 'sequel' | 'spinoff' | 'standalone' | 'related'
  notes: string | null
}

export interface MatchedGame {
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

export interface FamilyEnrichmentResult {
  success: boolean
  sourceGame: {
    id: string
    name: string
    wikipediaUrl: string
  }
  extraction: {
    description: string | null
    totalFound: number
  }
  matches: {
    inFamily: MatchedGame[]
    canLink: MatchedGame[]
    notInDb: MatchedGame[]
  }
  // Stats for automatic linking
  gamesLinked: number
  relationsCreated: number
  usage?: {
    model: string
    tokensInput: number
    tokensOutput: number
    costUsd: number
  }
  error?: string
}

// =====================================================
// Constants
// =====================================================

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

// =====================================================
// Helper Functions
// =====================================================

/**
 * Fetch Wikipedia article content using the MediaWiki API
 */
export async function fetchWikipediaArticleContent(wikipediaUrl: string): Promise<string> {
  // Extract article title from URL
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
export function normalizeGameName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[:\-–—]/g, ' ')
    .replace(/\s*&\s*/g, ' and ')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
}

/**
 * Map Wikipedia extraction type to database relation type
 */
export function mapWikipediaTypeToRelation(wikiType: string): RelationType | null {
  switch (wikiType) {
    case 'expansion':
      return 'expansion_of'
    case 'sequel':
      return 'sequel_to'
    case 'spinoff':
      return 'spin_off_of'
    case 'standalone':
      return 'standalone_in_series'
    case 'related':
      return null // Don't create relation for generic "related"
    default:
      return null
  }
}

/**
 * Match extracted games to games in the database
 */
export async function matchGamesToDatabase(
  supabase: SupabaseClient<Database>,
  extracted: ExtractedGame[],
  familyId: string,
  familyName: string
): Promise<MatchedGame[]> {
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

    // Try family prefix match (e.g., "Branch & Claw" -> "Spirit Island: Branch & Claw")
    if (!matchedGame) {
      const normalized = normalizeGameName(ext.name)
      const prefixedVariant = `${normalizedFamilyName} ${normalized}`
      if (gamesByNormalizedName.has(prefixedVariant)) {
        matchedGame = gamesByNormalizedName.get(prefixedVariant)!
        matchType = 'fuzzy'
      }
    }

    // Try suffix match
    if (!matchedGame) {
      const normalized = normalizeGameName(ext.name)
      for (const [gameName, game] of gamesByNormalizedName) {
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
      matchedGame: matchedGame
        ? {
            id: matchedGame.id,
            name: matchedGame.name,
            bgg_id: matchedGame.bgg_id,
            family_id: matchedGame.family_id,
            slug: matchedGame.slug,
          }
        : null,
      matchType,
      alreadyInFamily: matchedGame?.family_id === familyId,
    })
  }

  return results
}

// =====================================================
// Main Enrichment Function
// =====================================================

/**
 * Enrich a family from Wikipedia by extracting related games and creating relations.
 *
 * This function:
 * 1. Fetches the Wikipedia article for the source game
 * 2. Uses AI to extract related games (expansions, sequels, spinoffs)
 * 3. Matches extracted games to our database
 * 4. For high-confidence matches: links to family AND creates game_relations
 * 5. Returns results for UI display or logging
 *
 * @param supabase - Supabase admin client
 * @param familyId - The family to enrich
 * @param sourceGameId - The game whose Wikipedia article to use
 * @param wikipediaUrl - The Wikipedia URL to fetch
 * @param options - Optional settings
 */
export async function enrichFamilyFromWikipedia(
  supabase: SupabaseClient<Database>,
  familyId: string,
  sourceGameId: string,
  wikipediaUrl: string,
  options: {
    /** Only link exact and BGG ID matches automatically (default: true) */
    autoLinkHighConfidence?: boolean
    /** Also create game_relations entries (default: true) */
    createRelations?: boolean
  } = {}
): Promise<FamilyEnrichmentResult> {
  const { autoLinkHighConfidence = true, createRelations = true } = options

  const result: FamilyEnrichmentResult = {
    success: false,
    sourceGame: { id: sourceGameId, name: '', wikipediaUrl },
    extraction: { description: null, totalFound: 0 },
    matches: { inFamily: [], canLink: [], notInDb: [] },
    gamesLinked: 0,
    relationsCreated: 0,
  }

  try {
    // Get family and source game info
    const { data: family } = await supabase
      .from('game_families')
      .select('id, name')
      .eq('id', familyId)
      .single()

    if (!family) {
      result.error = 'Family not found'
      return result
    }

    const { data: sourceGame } = await supabase
      .from('games')
      .select('id, name')
      .eq('id', sourceGameId)
      .single()

    if (!sourceGame) {
      result.error = 'Source game not found'
      return result
    }

    result.sourceGame.name = sourceGame.name

    // Fetch Wikipedia content
    const wikiContent = await fetchWikipediaArticleContent(wikipediaUrl)

    if (!wikiContent || wikiContent.length < 100) {
      result.error = 'Wikipedia article content too short or empty'
      return result
    }

    // Truncate content if too long
    const truncatedContent =
      wikiContent.length > 15000
        ? wikiContent.slice(0, 15000) + '\n\n[Content truncated...]'
        : wikiContent

    // Extract with AI
    const aiResult = await generate(
      WIKIPEDIA_EXTRACTION_PROMPT,
      `Wikipedia article for "${sourceGame.name}":\n\n${truncatedContent}`,
      { temperature: 0.3 }
    )

    // Parse AI response
    let extraction: WikipediaExtraction
    try {
      let jsonStr = aiResult.content.trim()
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }
      extraction = JSON.parse(jsonStr)
    } catch {
      result.error = 'Failed to parse Wikipedia extraction'
      return result
    }

    // Combine all extracted games
    const allExtracted: ExtractedGame[] = [
      ...extraction.expansions,
      ...extraction.sequels,
      ...extraction.spinoffs,
      ...extraction.relatedGames,
    ]

    result.extraction = {
      description: extraction.description,
      totalFound: allExtracted.length,
    }

    result.usage = {
      model: aiResult.model,
      tokensInput: aiResult.tokensInput,
      tokensOutput: aiResult.tokensOutput,
      costUsd: aiResult.costUsd,
    }

    // Match to database
    const matchedGames = await matchGamesToDatabase(supabase, allExtracted, familyId, family.name)

    // Categorize results
    result.matches.inFamily = matchedGames.filter((m) => m.alreadyInFamily)
    result.matches.canLink = matchedGames.filter((m) => m.matchedGame && !m.alreadyInFamily)
    result.matches.notInDb = matchedGames.filter((m) => !m.matchedGame)

    // Auto-link high-confidence matches and create relations
    if (autoLinkHighConfidence) {
      for (const match of result.matches.canLink) {
        if (!match.matchedGame) continue

        // Only auto-link exact and BGG ID matches
        if (match.matchType !== 'exact' && match.matchType !== 'bgg_id') {
          continue
        }

        // Link to family
        await supabase
          .from('games')
          .update({ family_id: familyId })
          .eq('id', match.matchedGame.id)

        result.gamesLinked++

        // Create game_relations entry
        if (createRelations) {
          const relationType = mapWikipediaTypeToRelation(match.extracted.type)
          if (relationType && match.matchedGame.id !== sourceGameId) {
            const { error: relationError } = await supabase.from('game_relations').upsert(
              {
                source_game_id: match.matchedGame.id,
                target_game_id: sourceGameId,
                relation_type: relationType,
              },
              { onConflict: 'source_game_id,target_game_id,relation_type' }
            )

            if (!relationError) {
              result.relationsCreated++
            }
          }
        }
      }
    }

    // Update family_context with enrichment metadata
    const { data: existingFamily } = await supabase
      .from('game_families')
      .select('family_context')
      .eq('id', familyId)
      .single()

    const existingContext = (existingFamily?.family_context as Record<string, unknown>) || {}
    const updatedContext = {
      ...existingContext,
      wikipediaEnrichment: {
        lastEnrichedAt: new Date().toISOString(),
        sourceGameId,
        sourceWikipediaUrl: wikipediaUrl,
        totalExtracted: allExtracted.length,
        alreadyInFamily: result.matches.inFamily.length,
        autoLinked: result.gamesLinked,
        relationsCreated: result.relationsCreated,
        pendingReview: result.matches.canLink.filter(
          (m) => m.matchType === 'fuzzy'
        ).length,
        missingGames: result.matches.notInDb.map((m) => ({
          name: m.extracted.name,
          year: m.extracted.year,
          type: m.extracted.type,
          bggId: m.extracted.bggId,
        })),
      },
    }

    await supabase
      .from('game_families')
      .update({ family_context: updatedContext })
      .eq('id', familyId)

    result.success = true
    return result
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error'
    return result
  }
}

/**
 * Link games to a family and create relations.
 * Used by the manual enrichment UI when user selects games to link.
 *
 * @param supabase - Supabase admin client
 * @param familyId - The family to link to
 * @param sourceGameId - The base/source game (target of relations)
 * @param gamesToLink - Array of games to link with their relation types
 */
export async function linkGamesWithRelations(
  supabase: SupabaseClient<Database>,
  familyId: string,
  sourceGameId: string,
  gamesToLink: Array<{
    gameId: string
    relationType: 'expansion' | 'sequel' | 'spinoff' | 'standalone' | 'related'
  }>
): Promise<{ linked: number; relationsCreated: number }> {
  let linked = 0
  let relationsCreated = 0

  for (const { gameId, relationType } of gamesToLink) {
    // Skip if trying to link source game to itself
    if (gameId === sourceGameId) continue

    // Link to family
    const { error: linkError } = await supabase
      .from('games')
      .update({ family_id: familyId })
      .eq('id', gameId)

    if (!linkError) {
      linked++
    }

    // Create game_relations entry
    const dbRelationType = mapWikipediaTypeToRelation(relationType)
    if (dbRelationType) {
      const { error: relationError } = await supabase.from('game_relations').upsert(
        {
          source_game_id: gameId,
          target_game_id: sourceGameId,
          relation_type: dbRelationType,
        },
        { onConflict: 'source_game_id,target_game_id,relation_type' }
      )

      if (!relationError) {
        relationsCreated++
      }
    }
  }

  return { linked, relationsCreated }
}
