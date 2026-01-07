/**
 * Shared admin utility functions
 * Used across GameEditor tabs and admin components
 */

import type { TaxonomySuggestion } from '@/types/database'
import type { SelectedTaxonomyItem } from '@/lib/admin/wizard'

/**
 * Format a date string for display in admin UI
 * @param dateStr - ISO date string or null
 * @returns Formatted date like "Jan 5, 2026, 02:30 PM" or "Never"
 */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Auto-select threshold for AI suggestions (70%)
 */
export const AUTO_SELECT_THRESHOLD = 0.7

/**
 * Filter taxonomy suggestions by type and confidence threshold
 * Used to auto-select high-confidence AI suggestions
 *
 * @param suggestions - All taxonomy suggestions
 * @param type - The suggestion type to filter ('category' | 'mechanic' | 'theme' | 'player_experience')
 * @param existingIds - Set of IDs already selected (to avoid duplicates)
 * @param threshold - Minimum confidence threshold (default: 0.7)
 * @returns Array of SelectedTaxonomyItem to add to selection
 */
export function filterHighConfidenceSuggestions(
  suggestions: TaxonomySuggestion[],
  type: TaxonomySuggestion['suggestion_type'],
  existingIds: Set<string>,
  threshold: number = AUTO_SELECT_THRESHOLD
): SelectedTaxonomyItem[] {
  return suggestions
    .filter(s =>
      s.suggestion_type === type &&
      s.target_id &&
      (s.confidence ?? 0) >= threshold &&
      !existingIds.has(s.target_id)
    )
    .map(s => ({
      id: s.target_id!,
      isPrimary: false,
    }))
}

/**
 * Compare two taxonomy selection arrays for equality
 * Used for change detection in TaxonomyTab
 */
export function selectionsEqual(
  a: SelectedTaxonomyItem[],
  b: SelectedTaxonomyItem[]
): boolean {
  if (a.length !== b.length) return false
  return a.every(item => {
    const match = b.find(i => i.id === item.id)
    return match && match.isPrimary === item.isPrimary
  })
}
