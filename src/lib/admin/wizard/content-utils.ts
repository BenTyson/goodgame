/**
 * Shared utilities for wizard content parsing and formatting
 */
import type { Game, RulesContent, SetupContent, ReferenceContent } from '@/types/database'

// Default values for content types
export const DEFAULT_RULES_CONTENT: RulesContent = {
  quickStart: [],
  overview: '',
  setup: [],
  turnStructure: [],
  scoring: [],
  tips: [],
}

export const DEFAULT_SETUP_CONTENT: SetupContent = {
  playerSetup: [],
  boardSetup: [],
  componentChecklist: [],
  firstPlayerRule: '',
  quickTips: [],
}

export const DEFAULT_REFERENCE_CONTENT: ReferenceContent = {
  turnSummary: [],
  keyRules: [],
  costs: [],
  quickReminders: [],
  endGame: '',
}

/**
 * Format endGame which can be string or structured object
 */
export function formatEndGame(endGame: ReferenceContent['endGame']): string {
  if (!endGame) return ''
  if (typeof endGame === 'string') return endGame

  // Object format: { triggers, finalRound, winner, tiebreakers }
  const parts: string[] = []
  if (endGame.triggers?.length) {
    parts.push(`Triggers: ${endGame.triggers.join('; ')}`)
  }
  if (endGame.finalRound) {
    parts.push(`Final Round: ${endGame.finalRound}`)
  }
  if (endGame.winner) {
    parts.push(`Winner: ${endGame.winner}`)
  }
  if (endGame.tiebreakers?.length) {
    parts.push(`Tiebreakers: ${endGame.tiebreakers.join('; ')}`)
  }
  return parts.join('\n')
}

/**
 * Type guard for RulesContent
 */
export function isRulesContent(value: unknown): value is RulesContent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'overview' in value
  )
}

/**
 * Type guard for SetupContent
 */
export function isSetupContent(value: unknown): value is SetupContent {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('firstPlayerRule' in value || 'playerSetup' in value)
  )
}

/**
 * Type guard for ReferenceContent
 */
export function isReferenceContent(value: unknown): value is ReferenceContent {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('endGame' in value || 'quickReminders' in value)
  )
}

/**
 * Parse game content with type safety and defaults
 */
export function parseGameContent(game: Game) {
  const rulesContent: RulesContent = isRulesContent(game.rules_content)
    ? game.rules_content
    : DEFAULT_RULES_CONTENT

  const setupContent: SetupContent = isSetupContent(game.setup_content)
    ? game.setup_content
    : DEFAULT_SETUP_CONTENT

  const referenceContent: ReferenceContent = isReferenceContent(game.reference_content)
    ? game.reference_content
    : DEFAULT_REFERENCE_CONTENT

  return { rulesContent, setupContent, referenceContent }
}

/**
 * Check if game has any generated content
 */
export function hasGeneratedContent(game: Game): {
  hasRules: boolean
  hasSetup: boolean
  hasReference: boolean
  hasAny: boolean
} {
  const { rulesContent, setupContent, referenceContent } = parseGameContent(game)

  const hasRules = !!(rulesContent.overview || (rulesContent.quickStart?.length ?? 0) > 0)
  const hasSetup = !!(setupContent.firstPlayerRule || (setupContent.quickTips?.length ?? 0) > 0)
  const hasReference = !!(referenceContent.endGame || (referenceContent.quickReminders?.length ?? 0) > 0)

  return {
    hasRules,
    hasSetup,
    hasReference,
    hasAny: hasRules || hasSetup || hasReference,
  }
}
