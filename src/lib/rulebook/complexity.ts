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

// Re-export utility functions from complexity-utils.ts for backward compatibility
// These are safe to use in client components
export {
  getComplexityLabel,
  getComplexityColor,
  formatBNCSBreakdown,
  compareToBGGWeight,
  getComplexityProfile,
} from './complexity-utils'

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
      model: 'claude-haiku-4-5-20251101',
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

