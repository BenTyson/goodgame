/**
 * Crunch Score - Board Nomads Complexity Rating
 * AI-generated complexity scoring from rulebook analysis
 *
 * Scale: 1-10 (distinct from BGG's 1-5)
 * Formula: AI Score (85%) + BGG Weight (15%) as calibration
 *
 * Tiers:
 *   1.0-2.0: Breezy (quick to learn)
 *   2.1-4.0: Light (family-friendly)
 *   4.1-6.0: Crunchy (solid complexity)
 *   6.1-8.0: Heavy (meaty decisions)
 *   8.1-10.0: Brain Burner (maximum crunch)
 */

import { generateJSON } from '@/lib/ai/claude'
import { getCrunchScorePrompt } from './prompts'
import type { ParsedPDF, CrunchResult, CrunchBreakdown } from './types'

// Re-export utility functions from complexity-utils.ts for backward compatibility
export {
  getCrunchLabel,
  getCrunchColor,
  getCrunchBadgeClasses,
  formatCrunchBreakdown,
  getCrunchProfile,
  compareToBGGWeight,
  // Legacy aliases
  getComplexityLabel,
  getComplexityColor,
  formatBNCSBreakdown,
  getComplexityProfile,
} from './complexity-utils'

// Crunch Score response from AI (1-10 scale)
interface CrunchResponse {
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
 * Normalize BGG weight (1-5) to Crunch scale (1-10)
 * Maps: 1.0 -> 1.0, 3.0 -> 5.5, 5.0 -> 10.0
 */
export function normalizeBGGWeight(bggWeight: number): number {
  const normalized = (bggWeight - 1) / 4 * 9 + 1
  return Math.round(normalized * 10) / 10
}

/**
 * Calculate final Crunch Score with BGG calibration
 * Formula: AI Score (85%) + BGG Reference (15%)
 */
export function calculateCalibratedScore(
  aiScore: number,
  bggWeight: number | null
): { score: number; bggReference: number | null } {
  if (bggWeight === null || bggWeight === undefined) {
    // No BGG reference available, use pure AI score
    return { score: aiScore, bggReference: null }
  }

  const bggNormalized = normalizeBGGWeight(bggWeight)
  const calibratedScore = aiScore * 0.85 + bggNormalized * 0.15
  const finalScore = Math.round(calibratedScore * 10) / 10

  return {
    score: Math.max(1.0, Math.min(10.0, finalScore)),
    bggReference: bggWeight,
  }
}

/**
 * Analyze an error from crunch score generation and return a user-friendly message
 */
function analyzeCrunchError(
  error: Error & { rawResponse?: string },
  pdf: ParsedPDF,
  gameName: string
): string {
  const rawResponse = error.rawResponse?.toLowerCase() || ''
  const errorMsg = error.message.toLowerCase()

  // Check for AI refusal/apology patterns
  const apologized = rawResponse.includes('i apologize') ||
    rawResponse.includes('i cannot') ||
    rawResponse.includes("i'm unable") ||
    rawResponse.includes('sorry')

  // Check PDF metrics
  const isVeryShort = pdf.pageCount <= 2
  const isShort = pdf.pageCount <= 4
  const hasLowWordCount = pdf.wordCount < 500

  // Check for content type issues
  const looksLikeReferenceCard = pdf.wordCount < 300 && pdf.pageCount <= 2
  const looksLikeQuickStart = rawResponse.includes('quick start') ||
    rawResponse.includes('reference') ||
    rawResponse.includes('not a complete rulebook') ||
    rawResponse.includes('not contain')

  // Check for game name mismatch
  const gameNameLower = gameName.toLowerCase()
  const textSample = pdf.text.substring(0, 2000).toLowerCase()
  const hasGameNameInText = textSample.includes(gameNameLower) ||
    gameNameLower.split(/[\s:,-]+/).filter(w => w.length > 3).some(word => textSample.includes(word))

  // Determine specific error
  if (apologized || looksLikeQuickStart) {
    if (!hasGameNameInText && !isVeryShort) {
      return `Wrong rulebook: The PDF doesn't appear to be for "${gameName}". Please verify you have the correct rulebook URL.`
    }
    if (looksLikeReferenceCard) {
      return `Reference card detected: This appears to be a reference card or player aid (${pdf.pageCount} pages, ${pdf.wordCount} words), not a complete rulebook. Please use the full rulebook.`
    }
    if (isVeryShort) {
      return `Rulebook too short: Only ${pdf.pageCount} pages and ${pdf.wordCount} words. This may be a quick-start guide. Please use the complete rulebook for accurate scoring.`
    }
    if (hasLowWordCount) {
      return `Insufficient content: Only ${pdf.wordCount} words extracted. The PDF may be image-based or the text extraction failed. Try a different rulebook source.`
    }
    return `Unable to analyze: The AI couldn't determine complexity from this rulebook. It may not contain enough game rules or mechanics.`
  }

  if (isShort && errorMsg.includes('invalid json')) {
    return `Analysis incomplete: The rulebook (${pdf.pageCount} pages) may be too short for reliable complexity scoring. Consider using a more complete rulebook.`
  }

  if (errorMsg.includes('rate limit')) {
    return 'Rate limit reached: Too many requests. Please wait a moment and try again.'
  }

  if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
    return 'Request timed out: The analysis took too long. Please try again.'
  }

  // Generic fallback with helpful context
  return `Crunch score failed: Could not analyze complexity (${pdf.pageCount} pages, ${pdf.wordCount} words). Try a different rulebook or retry.`
}

/**
 * Generate Crunch Score from parsed rulebook
 * @param pdf - Parsed PDF content
 * @param gameName - Name of the game
 * @param bggWeight - Optional BGG weight for calibration (1-5 scale)
 */
export async function generateCrunchScore(
  pdf: ParsedPDF,
  gameName: string,
  bggWeight?: number | null
): Promise<CrunchResult> {
  const prompt = getCrunchScorePrompt(pdf.text, gameName, {
    pageCount: pdf.pageCount,
    wordCount: pdf.wordCount,
  })

  try {
    const { data } = await generateJSON<CrunchResponse>(
      'You are an expert board game complexity analyst. Analyze rulebooks and generate accurate complexity scores on a 1-10 scale.',
      prompt,
      {
        temperature: 0.3,
        model: 'claude-3-5-haiku-20241022',
      }
    )

    // Validate and clamp AI scores (1-10)
    const breakdown: CrunchBreakdown = {
      rulesDensity: clampScore(data.rulesDensity),
      decisionSpace: clampScore(data.decisionSpace),
      learningCurve: clampScore(data.learningCurve),
      strategicDepth: clampScore(data.strategicDepth),
      componentComplexity: clampScore(data.componentComplexity),
      reasoning: data.reasoning,
    }

    // Calculate AI-based overall score
    const aiScore = calculateOverallScore(breakdown)

    // Apply BGG calibration if available
    const { score, bggReference } = calculateCalibratedScore(aiScore, bggWeight ?? null)

    return {
      score,
      breakdown,
      confidence: data.confidence,
      bggReference,
      generatedAt: new Date(),
    }
  } catch (error) {
    // Analyze the error and throw with a more specific message
    const specificError = analyzeCrunchError(
      error as Error & { rawResponse?: string },
      pdf,
      gameName
    )
    throw new Error(specificError)
  }
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use generateCrunchScore instead
 */
export async function generateBNCS(
  pdf: ParsedPDF,
  gameName: string,
  bggWeight?: number | null
): Promise<CrunchResult> {
  return generateCrunchScore(pdf, gameName, bggWeight)
}

/**
 * Clamp score to valid range [1.0, 10.0]
 */
function clampScore(score: number): number {
  const clamped = Math.max(1.0, Math.min(10.0, score))
  return Math.round(clamped * 10) / 10
}

/**
 * Calculate overall Crunch Score from breakdown
 * Weights: Learning Curve and Rules Density weighted higher for new players
 */
function calculateOverallScore(breakdown: CrunchBreakdown): number {
  const weighted =
    breakdown.rulesDensity * 1.5 +
    breakdown.learningCurve * 1.5 +
    breakdown.decisionSpace * 1.0 +
    breakdown.strategicDepth * 1.0 +
    breakdown.componentComplexity * 1.0

  const score = weighted / 6.0
  return Math.round(score * 10) / 10
}
