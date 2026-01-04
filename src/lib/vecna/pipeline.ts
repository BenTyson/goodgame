/**
 * Vecna Pipeline Orchestration
 *
 * Core pipeline logic for processing games through the content generation stages.
 */

import type { VecnaState, PipelineProgress, FamilyContext } from './types'

/**
 * Determine the next state based on current state and game data
 */
export function getNextState(
  currentState: VecnaState,
  gameData: {
    hasRulebook: boolean
    hasWikipedia: boolean
    hasWikidata: boolean
    hasParsedText: boolean
    hasTaxonomy: boolean
    hasContent: boolean
  }
): VecnaState | null {
  switch (currentState) {
    case 'imported':
      // After import, check if enrichment data exists
      if (gameData.hasWikipedia || gameData.hasWikidata) {
        return 'enriched'
      }
      return null // Need enrichment

    case 'enriched':
      // After enrichment, check rulebook status
      if (gameData.hasRulebook) {
        return 'rulebook_ready'
      }
      return 'rulebook_missing' // Need manual rulebook

    case 'rulebook_missing':
      // Manual intervention needed
      if (gameData.hasRulebook) {
        return 'rulebook_ready'
      }
      return null // Still waiting

    case 'rulebook_ready':
      // Ready to parse
      return 'parsing'

    case 'parsing':
      // After parsing completes
      if (gameData.hasParsedText) {
        return 'parsed'
      }
      return null // Still parsing

    case 'parsed':
      // After parsing, assign taxonomy
      if (gameData.hasTaxonomy) {
        return 'taxonomy_assigned'
      }
      return 'taxonomy_assigned' // Auto-advance to taxonomy step

    case 'taxonomy_assigned':
      // Ready to generate content
      return 'generating'

    case 'generating':
      // After generation completes
      if (gameData.hasContent) {
        return 'generated'
      }
      return null // Still generating

    case 'generated':
      // Ready for human review
      return 'review_pending'

    case 'review_pending':
      // Human must approve - no auto-advance
      return null

    case 'published':
      // Terminal state
      return null

    default:
      return null
  }
}

/**
 * Check if a state can be auto-progressed (no human intervention needed)
 */
export function canAutoProgress(state: VecnaState): boolean {
  const autoProgressStates: VecnaState[] = [
    'imported',
    'enriched',
    'rulebook_ready',
    'parsing',
    'parsed',
    'taxonomy_assigned',
    'generating',
    'generated',
  ]
  return autoProgressStates.includes(state)
}

/**
 * Check if a state is a blocking state (requires human action)
 */
export function isBlockingState(state: VecnaState): boolean {
  return state === 'rulebook_missing' || state === 'review_pending'
}

/**
 * Check if a state is a processing state (actively doing work)
 */
export function isProcessingState(state: VecnaState): boolean {
  return state === 'parsing' || state === 'generating'
}

/**
 * Calculate pipeline progress for a family
 */
export function calculatePipelineProgress(
  familyId: string,
  games: Array<{
    id: string
    vecna_state: VecnaState
    has_rulebook: boolean
    vecna_error: string | null
  }>
): PipelineProgress {
  // Count games by state
  const stageBreakdown: Record<VecnaState, number> = {
    imported: 0,
    enriched: 0,
    rulebook_missing: 0,
    rulebook_ready: 0,
    parsing: 0,
    parsed: 0,
    taxonomy_assigned: 0,
    generating: 0,
    generated: 0,
    review_pending: 0,
    published: 0,
  }

  for (const game of games) {
    stageBreakdown[game.vecna_state]++
  }

  // Find current game being processed
  const processingGame = games.find(g => isProcessingState(g.vecna_state))
  const currentGameId = processingGame?.id || null
  const currentStage = processingGame?.vecna_state || null

  // Count completed games (published)
  const completedGames = stageBreakdown.published

  // Calculate progress percentage
  // Weight: published = 100%, review = 90%, generated = 80%, etc.
  const stateWeights: Record<VecnaState, number> = {
    imported: 0.05,
    enriched: 0.15,
    rulebook_missing: 0.15,
    rulebook_ready: 0.25,
    parsing: 0.35,
    parsed: 0.45,
    taxonomy_assigned: 0.55,
    generating: 0.65,
    generated: 0.80,
    review_pending: 0.90,
    published: 1.0,
  }

  let totalProgress = 0
  for (const game of games) {
    totalProgress += stateWeights[game.vecna_state]
  }
  const progressPercent = games.length > 0
    ? Math.round((totalProgress / games.length) * 100)
    : 0

  // Find blockers
  const gamesNeedingRulebook = games
    .filter(g => !g.has_rulebook && g.vecna_state !== 'published')
    .map(g => g.id)

  const gamesWithErrors = games
    .filter(g => g.vecna_error)
    .map(g => ({ gameId: g.id, error: g.vecna_error! }))

  return {
    familyId,
    currentGameId,
    currentStage,
    totalGames: games.length,
    completedGames,
    progressPercent,
    stageBreakdown,
    gamesNeedingRulebook,
    gamesWithErrors,
  }
}

/**
 * Sort games in processing order (base game first, then expansions by year)
 */
export function sortGamesForProcessing(
  games: Array<{
    id: string
    year_published: number | null
    relation_type?: string
  }>,
  baseGameId: string | null
): string[] {
  const sorted = [...games].sort((a, b) => {
    // Base game always first
    if (a.id === baseGameId) return -1
    if (b.id === baseGameId) return 1

    // Then by year
    const yearA = a.year_published || 9999
    const yearB = b.year_published || 9999
    return yearA - yearB
  })

  return sorted.map(g => g.id)
}

/**
 * Build family context from base game for expansion processing
 */
export function buildFamilyContext(baseGame: {
  id: string
  name: string
  mechanics?: string[]
  themes?: string[]
  setup_content?: { overview?: string } | null
  rules_content?: { overview?: string } | null
  component_list?: string[]
}): FamilyContext {
  return {
    baseGameId: baseGame.id,
    baseGameName: baseGame.name,
    coreMechanics: baseGame.mechanics || [],
    coreTheme: (baseGame.themes || [])[0] || '',
    baseSetupSummary: baseGame.setup_content?.overview || '',
    baseRulesOverview: baseGame.rules_content?.overview || '',
    componentTypes: baseGame.component_list || [],
  }
}

/**
 * Check if game can skip certain stages (e.g., no rulebook but has Wikipedia)
 */
export function canSkipRulebook(game: {
  has_wikipedia: boolean
  wikipedia_gameplay?: string | null
}): boolean {
  // Games with Wikipedia gameplay section can generate limited content without rulebook
  return game.has_wikipedia && !!game.wikipedia_gameplay
}

/**
 * Get human-readable status message for a game
 */
export function getStatusMessage(state: VecnaState, error?: string | null): string {
  if (error) {
    return `Error: ${error}`
  }

  const messages: Record<VecnaState, string> = {
    imported: 'Imported from BGG, awaiting enrichment',
    enriched: 'Enriched with external data, checking rulebook',
    rulebook_missing: 'Waiting for rulebook URL',
    rulebook_ready: 'Rulebook confirmed, ready to parse',
    parsing: 'Parsing rulebook...',
    parsed: 'Rulebook parsed, assigning taxonomy',
    taxonomy_assigned: 'Categories assigned, ready to generate content',
    generating: 'Generating AI content...',
    generated: 'Content generated, ready for review',
    review_pending: 'Awaiting human review',
    published: 'Published and live',
  }

  return messages[state]
}
