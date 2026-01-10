/**
 * Complexity tier utilities for Crunch Score (1-10 scale)
 * Single source of truth for complexity classification
 */

export interface ComplexityTierInfo {
  label: string
  color: string
}

/**
 * Tier thresholds for crunch scores (1-10 scale)
 */
export const COMPLEXITY_TIERS = {
  GATEWAY: { max: 2, label: 'Gateway', color: 'text-emerald-600 dark:text-emerald-400' },
  LIGHT: { max: 4, label: 'Light', color: 'text-green-600 dark:text-green-400' },
  MEDIUM_LIGHT: { max: 5.5, label: 'Medium-Light', color: 'text-lime-600 dark:text-lime-400' },
  MEDIUM: { max: 6.5, label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400' },
  MEDIUM_HEAVY: { max: 7.5, label: 'Medium-Heavy', color: 'text-orange-600 dark:text-orange-400' },
  HEAVY: { max: 8.5, label: 'Heavy', color: 'text-red-600 dark:text-red-400' },
  EXPERT: { max: 10, label: 'Expert', color: 'text-rose-600 dark:text-rose-400' },
} as const

/**
 * Get complexity tier info (label + color) from a crunch score
 */
export function getCrunchTier(score: number): ComplexityTierInfo {
  if (score <= COMPLEXITY_TIERS.GATEWAY.max) return COMPLEXITY_TIERS.GATEWAY
  if (score <= COMPLEXITY_TIERS.LIGHT.max) return COMPLEXITY_TIERS.LIGHT
  if (score <= COMPLEXITY_TIERS.MEDIUM_LIGHT.max) return COMPLEXITY_TIERS.MEDIUM_LIGHT
  if (score <= COMPLEXITY_TIERS.MEDIUM.max) return COMPLEXITY_TIERS.MEDIUM
  if (score <= COMPLEXITY_TIERS.MEDIUM_HEAVY.max) return COMPLEXITY_TIERS.MEDIUM_HEAVY
  if (score <= COMPLEXITY_TIERS.HEAVY.max) return COMPLEXITY_TIERS.HEAVY
  return COMPLEXITY_TIERS.EXPERT
}

/**
 * Get just the complexity label from a crunch score
 */
export function getComplexityLabel(score: number): string {
  return getCrunchTier(score).label
}
