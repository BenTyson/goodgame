/**
 * Pure utility functions for Crunch Score display
 * These functions have NO AI/server dependencies and are safe for client components
 *
 * Crunch Score Tiers (1-10 scale):
 *   1.0-2.0: Breezy (quick to learn, minimal rules)
 *   2.1-4.0: Light (family-friendly depth)
 *   4.1-6.0: Crunchy (solid complexity)
 *   6.1-8.0: Heavy (meaty decisions)
 *   8.1-10.0: Brain Burner (maximum crunch)
 */

import type { CrunchBreakdown, BNCSBreakdown } from './types'

/**
 * Get human-readable Crunch tier label (1-10 scale)
 */
export function getCrunchLabel(score: number): string {
  if (score <= 2.0) return 'Breezy'
  if (score <= 4.0) return 'Light'
  if (score <= 6.0) return 'Crunchy'
  if (score <= 8.0) return 'Heavy'
  return 'Brain Burner'
}

/**
 * Get Crunch tier color class for UI (1-10 scale)
 */
export function getCrunchColor(score: number): string {
  if (score <= 2.0) return 'text-green-600'    // Breezy
  if (score <= 4.0) return 'text-teal-600'     // Light
  if (score <= 6.0) return 'text-amber-600'    // Crunchy
  if (score <= 8.0) return 'text-orange-600'   // Heavy
  return 'text-red-600'                        // Brain Burner
}

/**
 * Get Crunch tier badge classes for UI (1-10 scale)
 */
export function getCrunchBadgeClasses(score: number): string {
  if (score <= 2.0) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  if (score <= 4.0) return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'
  if (score <= 6.0) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  if (score <= 8.0) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
}

/**
 * Format Crunch breakdown for display (1-10 scale)
 */
export function formatCrunchBreakdown(breakdown: CrunchBreakdown): Array<{
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
 * Generate a "complexity profile" string for the game (1-10 scale)
 * e.g., "Easy to learn, hard to master" or "Simple and quick"
 */
export function getCrunchProfile(breakdown: CrunchBreakdown): string {
  const profiles: string[] = []

  // Learning vs Mastery comparison (scaled for 1-10)
  if (breakdown.learningCurve <= 4.0 && breakdown.strategicDepth > 7.0) {
    profiles.push('Easy to learn, hard to master')
  } else if (breakdown.learningCurve <= 3.0 && breakdown.strategicDepth <= 4.0) {
    profiles.push('Simple and approachable')
  } else if (breakdown.learningCurve > 7.0 && breakdown.strategicDepth > 7.0) {
    profiles.push('Complex and rewarding')
  } else if (breakdown.learningCurve > 6.0) {
    profiles.push('Takes time to learn')
  }

  // Decision space notes (scaled for 1-10)
  if (breakdown.decisionSpace > 8.0) {
    profiles.push('Many meaningful choices')
  } else if (breakdown.decisionSpace <= 3.0) {
    profiles.push('Streamlined gameplay')
  }

  // Rules density notes (scaled for 1-10)
  if (breakdown.rulesDensity > 8.0) {
    profiles.push('Rule-heavy')
  } else if (breakdown.rulesDensity <= 3.0) {
    profiles.push('Few rules to remember')
  }

  // Component complexity (scaled for 1-10)
  if (breakdown.componentComplexity > 8.0) {
    profiles.push('Lots to track')
  } else if (breakdown.componentComplexity <= 3.0) {
    profiles.push('Clean game state')
  }

  return profiles.slice(0, 2).join(' • ') || 'Balanced complexity'
}

/**
 * Compare Crunch Score to BGG weight (for display)
 * Note: BGG uses 1-5, Crunch uses 1-10
 */
export function compareToBGGWeight(
  crunchScore: number,
  bggWeight: number | null
): {
  difference: number | null
  assessment: 'aligned' | 'lighter' | 'heavier' | 'unknown'
} {
  if (bggWeight === null) {
    return { difference: null, assessment: 'unknown' }
  }

  // Normalize BGG to 1-10 for fair comparison
  const bggNormalized = (bggWeight - 1) / 4 * 9 + 1
  const difference = crunchScore - bggNormalized

  if (Math.abs(difference) < 1.0) {
    return { difference, assessment: 'aligned' }
  } else if (difference < 0) {
    return { difference, assessment: 'lighter' }
  } else {
    return { difference, assessment: 'heavier' }
  }
}

// ============================================
// Legacy aliases for backward compatibility
// ============================================

/**
 * @deprecated Use getCrunchLabel instead
 */
export function getComplexityLabel(score: number): string {
  // Handle legacy 1-5 scale scores
  if (score <= 5.0) {
    // Assume it's old 1-5 scale, convert to 1-10
    const normalized = (score - 1) / 4 * 9 + 1
    return getCrunchLabel(normalized)
  }
  return getCrunchLabel(score)
}

/**
 * @deprecated Use getCrunchColor instead
 */
export function getComplexityColor(score: number): string {
  // Handle legacy 1-5 scale scores
  if (score <= 5.0) {
    const normalized = (score - 1) / 4 * 9 + 1
    return getCrunchColor(normalized)
  }
  return getCrunchColor(score)
}

/**
 * @deprecated Use formatCrunchBreakdown instead
 */
export function formatBNCSBreakdown(breakdown: BNCSBreakdown): Array<{
  label: string
  value: number
  description: string
}> {
  return formatCrunchBreakdown(breakdown)
}

/**
 * @deprecated Use getCrunchProfile instead
 */
export function getComplexityProfile(breakdown: BNCSBreakdown): string {
  return getCrunchProfile(breakdown)
}
