/**
 * Vecna Quality Validation
 *
 * Pre-publish quality checks for generated content.
 * Ensures content meets minimum standards before going live.
 */

import type { RulesContent, SetupContent, ReferenceContent } from '@/lib/rulebook'

// =====================================================
// Types
// =====================================================

export interface QualityIssue {
  severity: 'error' | 'warning' | 'info'
  category: 'completeness' | 'length' | 'content' | 'format'
  field: string
  message: string
}

export interface QualityResult {
  passed: boolean
  score: number // 0-100
  issues: QualityIssue[]
  summary: {
    errors: number
    warnings: number
    info: number
  }
}

export interface ContentQualityConfig {
  // Minimum lengths (characters)
  minOverviewLength: number
  minQuickStartItems: number
  minCoreRulesCategories: number
  minTurnPhases: number
  minTips: number
  minSetupSteps: number
  minComponents: number

  // Complex game thresholds (for games with long rulebooks)
  isComplexGame: boolean

  // Content checks
  checkForAIArtifacts: boolean
  checkForPlaceholders: boolean
}

const DEFAULT_CONFIG: ContentQualityConfig = {
  minOverviewLength: 150,
  minQuickStartItems: 3,
  minCoreRulesCategories: 2,
  minTurnPhases: 1,
  minTips: 2,
  minSetupSteps: 3,
  minComponents: 2,
  isComplexGame: false,
  checkForAIArtifacts: true,
  checkForPlaceholders: true,
}

// =====================================================
// AI Artifact Detection
// =====================================================

const AI_ARTIFACT_PATTERNS = [
  /\bI'll\b/i,
  /\bI would\b/i,
  /\bI can\b/i,
  /\bI'm\b/i,
  /\bAs an AI\b/i,
  /\bAs a language model\b/i,
  /\bI don't have access\b/i,
  /\bI cannot\b/i,
  /\bHere's the\b/i,
  /\bHere is the\b/i,
  /\bLet me\b/i,
  /\bI've created\b/i,
  /\bI've generated\b/i,
  /\bBased on the rulebook\b/i,
  /\bAccording to the rulebook\b/i,
  /\bThe rulebook states\b/i,
  /\bThe rulebook mentions\b/i,
]

const PLACEHOLDER_PATTERNS = [
  /\[.*?\]/g, // [placeholder text]
  /<.*?>/g, // <placeholder text>
  /TODO/i,
  /TBD/i,
  /FIXME/i,
  /XXX/,
  /\bplaceholder\b/i,
  /\binsert\b.*\bhere\b/i,
  /\bexample\b.*\bhere\b/i,
]

function containsAIArtifacts(text: string): string[] {
  const found: string[] = []
  for (const pattern of AI_ARTIFACT_PATTERNS) {
    const match = text.match(pattern)
    if (match) {
      found.push(match[0])
    }
  }
  return found
}

function containsPlaceholders(text: string): string[] {
  const found: string[] = []
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      found.push(...matches.slice(0, 3)) // Limit to first 3 matches
    }
  }
  return found
}

// =====================================================
// Content Validation Functions
// =====================================================

/**
 * Validate rules content quality
 */
export function validateRulesContent(
  content: RulesContent | null,
  config: Partial<ContentQualityConfig> = {}
): QualityResult {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const issues: QualityIssue[] = []

  if (!content) {
    return {
      passed: false,
      score: 0,
      issues: [{ severity: 'error', category: 'completeness', field: 'rules_content', message: 'No rules content found' }],
      summary: { errors: 1, warnings: 0, info: 0 },
    }
  }

  // Check overview
  if (!content.overview) {
    issues.push({ severity: 'error', category: 'completeness', field: 'overview', message: 'Missing overview' })
  } else if (content.overview.length < cfg.minOverviewLength) {
    issues.push({
      severity: 'warning',
      category: 'length',
      field: 'overview',
      message: `Overview too short (${content.overview.length} chars, minimum ${cfg.minOverviewLength})`,
    })
  }

  // Check quickStart
  if (!content.quickStart || content.quickStart.length < cfg.minQuickStartItems) {
    issues.push({
      severity: 'warning',
      category: 'completeness',
      field: 'quickStart',
      message: `Need at least ${cfg.minQuickStartItems} quick start items (found ${content.quickStart?.length || 0})`,
    })
  }

  // Check coreRules
  if (!content.coreRules || content.coreRules.length < cfg.minCoreRulesCategories) {
    issues.push({
      severity: 'warning',
      category: 'completeness',
      field: 'coreRules',
      message: `Need at least ${cfg.minCoreRulesCategories} core rules categories (found ${content.coreRules?.length || 0})`,
    })
  }

  // Check turnStructure
  if (!content.turnStructure || content.turnStructure.length < cfg.minTurnPhases) {
    issues.push({
      severity: 'warning',
      category: 'completeness',
      field: 'turnStructure',
      message: `Need at least ${cfg.minTurnPhases} turn phase (found ${content.turnStructure?.length || 0})`,
    })
  }

  // Check winCondition
  if (!content.winCondition) {
    issues.push({ severity: 'error', category: 'completeness', field: 'winCondition', message: 'Missing win condition' })
  }

  // Check tips
  if (!content.tips || content.tips.length < cfg.minTips) {
    issues.push({
      severity: 'info',
      category: 'completeness',
      field: 'tips',
      message: `Consider adding more tips (found ${content.tips?.length || 0}, recommend ${cfg.minTips}+)`,
    })
  }

  // Check for AI artifacts in all text content
  if (cfg.checkForAIArtifacts) {
    const allText = JSON.stringify(content)
    const artifacts = containsAIArtifacts(allText)
    if (artifacts.length > 0) {
      issues.push({
        severity: 'error',
        category: 'content',
        field: 'rules_content',
        message: `AI artifacts detected: ${artifacts.slice(0, 3).join(', ')}`,
      })
    }
  }

  // Check for placeholders
  if (cfg.checkForPlaceholders) {
    const allText = JSON.stringify(content)
    const placeholders = containsPlaceholders(allText)
    if (placeholders.length > 0) {
      issues.push({
        severity: 'error',
        category: 'content',
        field: 'rules_content',
        message: `Placeholder text detected: ${placeholders.slice(0, 3).join(', ')}`,
      })
    }
  }

  // Phase 2: Check for new sections in complex games
  if (cfg.isComplexGame && !content.complexityNote) {
    issues.push({
      severity: 'info',
      category: 'completeness',
      field: 'complexityNote',
      message: 'Complex game should have a complexity acknowledgment note',
    })
  }

  // Check whatMakesThisSpecial (Phase 2)
  if (!content.whatMakesThisSpecial) {
    issues.push({
      severity: 'info',
      category: 'completeness',
      field: 'whatMakesThisSpecial',
      message: 'Consider adding "What Makes This Special" section for better engagement',
    })
  }

  return calculateResult(issues)
}

/**
 * Validate setup content quality
 */
export function validateSetupContent(
  content: SetupContent | null,
  config: Partial<ContentQualityConfig> = {}
): QualityResult {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const issues: QualityIssue[] = []

  if (!content) {
    return {
      passed: false,
      score: 0,
      issues: [{ severity: 'error', category: 'completeness', field: 'setup_content', message: 'No setup content found' }],
      summary: { errors: 1, warnings: 0, info: 0 },
    }
  }

  // Check overview
  if (!content.overview) {
    issues.push({ severity: 'error', category: 'completeness', field: 'overview', message: 'Missing setup overview' })
  }

  // Check components
  if (!content.components || content.components.length < cfg.minComponents) {
    issues.push({
      severity: 'warning',
      category: 'completeness',
      field: 'components',
      message: `Need at least ${cfg.minComponents} components listed (found ${content.components?.length || 0})`,
    })
  }

  // Check steps
  if (!content.steps || content.steps.length < cfg.minSetupSteps) {
    issues.push({
      severity: 'warning',
      category: 'completeness',
      field: 'steps',
      message: `Need at least ${cfg.minSetupSteps} setup steps (found ${content.steps?.length || 0})`,
    })
  }

  // Check firstPlayerRule
  if (!content.firstPlayerRule) {
    issues.push({
      severity: 'info',
      category: 'completeness',
      field: 'firstPlayerRule',
      message: 'Missing first player rule',
    })
  }

  // Check playerSetup
  if (!content.playerSetup) {
    issues.push({
      severity: 'warning',
      category: 'completeness',
      field: 'playerSetup',
      message: 'Missing player setup section',
    })
  }

  // Check for AI artifacts
  if (cfg.checkForAIArtifacts) {
    const allText = JSON.stringify(content)
    const artifacts = containsAIArtifacts(allText)
    if (artifacts.length > 0) {
      issues.push({
        severity: 'error',
        category: 'content',
        field: 'setup_content',
        message: `AI artifacts detected: ${artifacts.slice(0, 3).join(', ')}`,
      })
    }
  }

  return calculateResult(issues)
}

/**
 * Validate reference content quality
 */
export function validateReferenceContent(
  content: ReferenceContent | null,
  config: Partial<ContentQualityConfig> = {}
): QualityResult {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const issues: QualityIssue[] = []

  if (!content) {
    return {
      passed: false,
      score: 0,
      issues: [{ severity: 'error', category: 'completeness', field: 'reference_content', message: 'No reference content found' }],
      summary: { errors: 1, warnings: 0, info: 0 },
    }
  }

  // Check turnSummary
  if (!content.turnSummary || content.turnSummary.length === 0) {
    issues.push({
      severity: 'warning',
      category: 'completeness',
      field: 'turnSummary',
      message: 'Missing turn summary',
    })
  }

  // Check endGame
  if (!content.endGame) {
    issues.push({
      severity: 'warning',
      category: 'completeness',
      field: 'endGame',
      message: 'Missing end game conditions',
    })
  }

  // Check scoringSummary
  if (!content.scoringSummary || content.scoringSummary.length === 0) {
    issues.push({
      severity: 'info',
      category: 'completeness',
      field: 'scoringSummary',
      message: 'Missing scoring summary',
    })
  }

  // Check importantRules
  if (!content.importantRules || content.importantRules.length === 0) {
    issues.push({
      severity: 'info',
      category: 'completeness',
      field: 'importantRules',
      message: 'Consider adding important rules reminders',
    })
  }

  // Check for AI artifacts
  if (cfg.checkForAIArtifacts) {
    const allText = JSON.stringify(content)
    const artifacts = containsAIArtifacts(allText)
    if (artifacts.length > 0) {
      issues.push({
        severity: 'error',
        category: 'content',
        field: 'reference_content',
        message: `AI artifacts detected: ${artifacts.slice(0, 3).join(', ')}`,
      })
    }
  }

  return calculateResult(issues)
}

/**
 * Validate all content for a game
 */
export function validateAllContent(
  rulesContent: RulesContent | null,
  setupContent: SetupContent | null,
  referenceContent: ReferenceContent | null,
  config: Partial<ContentQualityConfig> = {}
): {
  overall: QualityResult
  rules: QualityResult
  setup: QualityResult
  reference: QualityResult
} {
  const rules = validateRulesContent(rulesContent, config)
  const setup = validateSetupContent(setupContent, config)
  const reference = validateReferenceContent(referenceContent, config)

  // Combine all issues
  const allIssues = [
    ...rules.issues.map(i => ({ ...i, field: `rules.${i.field}` })),
    ...setup.issues.map(i => ({ ...i, field: `setup.${i.field}` })),
    ...reference.issues.map(i => ({ ...i, field: `reference.${i.field}` })),
  ]

  const overall = calculateResult(allIssues)

  // Overall passes only if no errors in any section
  overall.passed = rules.passed && setup.passed && reference.passed

  return { overall, rules, setup, reference }
}

// =====================================================
// Helper Functions
// =====================================================

function calculateResult(issues: QualityIssue[]): QualityResult {
  const errors = issues.filter(i => i.severity === 'error').length
  const warnings = issues.filter(i => i.severity === 'warning').length
  const info = issues.filter(i => i.severity === 'info').length

  // Score calculation: start at 100, deduct for issues
  // Errors: -20 each, Warnings: -10 each, Info: -2 each
  const score = Math.max(0, 100 - (errors * 20) - (warnings * 10) - (info * 2))

  return {
    passed: errors === 0,
    score,
    issues,
    summary: { errors, warnings, info },
  }
}

/**
 * Get a human-readable quality summary
 */
export function getQualitySummary(result: QualityResult): string {
  if (result.passed && result.score >= 90) {
    return 'Excellent - Ready for publication'
  } else if (result.passed && result.score >= 70) {
    return 'Good - Minor improvements suggested'
  } else if (result.passed) {
    return 'Acceptable - Consider addressing warnings'
  } else {
    return `Not ready - ${result.summary.errors} error(s) must be fixed`
  }
}
