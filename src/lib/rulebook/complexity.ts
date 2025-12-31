/**
 * Board Nomads Complexity Score (BNCS)
 * AI-generated complexity scoring from rulebook analysis
 *
 * This is our differentiator vs BGG's user-submitted weight scores.
 * BNCS provides:
 * - Transparent methodology
 * - Consistent scoring
 * - Multi-dimensional breakdown
 * - Original intellectual property
 */

import { generateJSON } from '@/lib/ai/claude'
import { getBNCSPrompt } from './prompts'
import type { ParsedPDF, BNCSResult, BNCSBreakdown } from './types'

// BNCS response from AI
interface BNCSResponse {
  rulesDensity: number
  decisionSpace: number
  learningCurve: number
  strategicDepth: number
  componentComplexity: number
  overallScore: number
  reasoning: string
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Generate BNCS score from parsed rulebook
 */
export async function generateBNCS(
  pdf: ParsedPDF,
  gameName: string
): Promise<BNCSResult> {
  const prompt = getBNCSPrompt(pdf.text, gameName, {
    pageCount: pdf.pageCount,
    wordCount: pdf.wordCount,
  })

  const { data } = await generateJSON<BNCSResponse>(
    'You are an expert board game complexity analyst. Analyze rulebooks and generate accurate complexity scores.',
    prompt,
    {
      temperature: 0.3, // Lower temperature for more consistent scoring
      model: 'claude-3-haiku-20240307',
    }
  )

  // Validate and clamp scores
  const breakdown: BNCSBreakdown = {
    rulesDensity: clampScore(data.rulesDensity),
    decisionSpace: clampScore(data.decisionSpace),
    learningCurve: clampScore(data.learningCurve),
    strategicDepth: clampScore(data.strategicDepth),
    componentComplexity: clampScore(data.componentComplexity),
    reasoning: data.reasoning,
  }

  // Calculate overall score (weighted average)
  const calculatedScore = calculateOverallScore(breakdown)

  return {
    score: calculatedScore,
    breakdown,
    confidence: data.confidence,
    generatedAt: new Date(),
  }
}

/**
 * Clamp score to valid range [1.0, 5.0]
 */
function clampScore(score: number): number {
  const clamped = Math.max(1.0, Math.min(5.0, score))
  return Math.round(clamped * 10) / 10 // Round to 1 decimal
}

/**
 * Calculate overall BNCS score from breakdown
 * Weights: Learning Curve and Rules Density are more important for new players
 */
function calculateOverallScore(breakdown: BNCSBreakdown): number {
  const weighted =
    breakdown.rulesDensity * 1.5 +
    breakdown.learningCurve * 1.5 +
    breakdown.decisionSpace * 1.0 +
    breakdown.strategicDepth * 1.0 +
    breakdown.componentComplexity * 1.0

  const score = weighted / 6.0
  return Math.round(score * 10) / 10
}

/**
 * Get human-readable complexity label
 */
export function getComplexityLabel(score: number): string {
  if (score < 1.8) return 'Gateway'
  if (score < 2.5) return 'Family'
  if (score < 3.2) return 'Medium'
  if (score < 4.0) return 'Heavy'
  return 'Expert'
}

/**
 * Get complexity color class for UI
 */
export function getComplexityColor(score: number): string {
  if (score < 1.8) return 'text-green-600'
  if (score < 2.5) return 'text-teal-600'
  if (score < 3.2) return 'text-amber-600'
  if (score < 4.0) return 'text-orange-600'
  return 'text-red-600'
}

/**
 * Format BNCS breakdown for display
 */
export function formatBNCSBreakdown(breakdown: BNCSBreakdown): Array<{
  label: string
  value: number
  description: string
}> {
  return [
    {
      label: 'Rules Density',
      value: breakdown.rulesDensity,
      description: 'Amount of rules to learn',
    },
    {
      label: 'Decision Space',
      value: breakdown.decisionSpace,
      description: 'Choices available per turn',
    },
    {
      label: 'Learning Curve',
      value: breakdown.learningCurve,
      description: 'Time to understand the game',
    },
    {
      label: 'Strategic Depth',
      value: breakdown.strategicDepth,
      description: 'Long-term planning complexity',
    },
    {
      label: 'Component Complexity',
      value: breakdown.componentComplexity,
      description: 'Game state tracking difficulty',
    },
  ]
}

/**
 * Compare BNCS to existing weight (for validation during transition)
 */
export function compareToBGGWeight(
  bncsScore: number,
  bggWeight: number | null
): {
  difference: number | null
  assessment: 'aligned' | 'lighter' | 'heavier' | 'unknown'
} {
  if (bggWeight === null) {
    return { difference: null, assessment: 'unknown' }
  }

  const difference = bncsScore - bggWeight

  if (Math.abs(difference) < 0.5) {
    return { difference, assessment: 'aligned' }
  } else if (difference < 0) {
    return { difference, assessment: 'lighter' }
  } else {
    return { difference, assessment: 'heavier' }
  }
}

/**
 * Generate a "complexity profile" string for the game
 * e.g., "Easy to learn, hard to master" or "Simple and quick"
 */
export function getComplexityProfile(breakdown: BNCSBreakdown): string {
  const profiles: string[] = []

  // Learning vs Mastery comparison
  if (breakdown.learningCurve < 2.5 && breakdown.strategicDepth > 3.5) {
    profiles.push('Easy to learn, hard to master')
  } else if (breakdown.learningCurve < 2.0 && breakdown.strategicDepth < 2.5) {
    profiles.push('Simple and approachable')
  } else if (breakdown.learningCurve > 3.5 && breakdown.strategicDepth > 3.5) {
    profiles.push('Complex and rewarding')
  } else if (breakdown.learningCurve > 3.0) {
    profiles.push('Takes time to learn')
  }

  // Decision space notes
  if (breakdown.decisionSpace > 4.0) {
    profiles.push('Many meaningful choices')
  } else if (breakdown.decisionSpace < 2.0) {
    profiles.push('Streamlined gameplay')
  }

  // Rules density notes
  if (breakdown.rulesDensity > 4.0) {
    profiles.push('Rule-heavy')
  } else if (breakdown.rulesDensity < 2.0) {
    profiles.push('Few rules to remember')
  }

  // Component complexity
  if (breakdown.componentComplexity > 4.0) {
    profiles.push('Lots to track')
  } else if (breakdown.componentComplexity < 2.0) {
    profiles.push('Clean game state')
  }

  return profiles.slice(0, 2).join(' • ') || 'Balanced complexity'
}
