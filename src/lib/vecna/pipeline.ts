/**
 * Vecna Pipeline Orchestration
 *
 * Core pipeline logic for processing games through the content generation stages.
 */

import type { VecnaState, PipelineProgress, FamilyContext } from './types'

/**
 * Check if a state is blocked (requires human action)
 */
export function isBlockedState(state: VecnaState): boolean {
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
  // Enhanced Wikipedia fields
  wikipedia_origins?: string | null
  wikipedia_reception?: string | null
  wikipedia_awards?: Array<{ name: string; status?: string }> | null
  wikipedia_infobox?: {
    designers?: string[]
    publishers?: Array<{ name: string }> | string[]
  } | null
}): FamilyContext {
  // Extract award names for context
  const awardNames = baseGame.wikipedia_awards
    ?.filter(a => a.status === 'winner' || !a.status)
    .map(a => a.name) || null

  // Extract publisher names (handle both array of objects and array of strings)
  const publisherNames = baseGame.wikipedia_infobox?.publishers
    ? baseGame.wikipedia_infobox.publishers.map(p => typeof p === 'string' ? p : p.name)
    : null

  return {
    baseGameId: baseGame.id,
    baseGameName: baseGame.name,
    coreMechanics: baseGame.mechanics || [],
    coreTheme: (baseGame.themes || [])[0] || '',
    baseSetupSummary: baseGame.setup_content?.overview || '',
    baseRulesOverview: baseGame.rules_content?.overview || '',
    componentTypes: baseGame.component_list || [],
    // Enhanced Wikipedia context
    baseGameOrigins: baseGame.wikipedia_origins || null,
    baseGameReception: baseGame.wikipedia_reception || null,
    baseGameAwards: awardNames,
    baseGameDesigners: baseGame.wikipedia_infobox?.designers || null,
    baseGamePublishers: publisherNames,
  }
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
