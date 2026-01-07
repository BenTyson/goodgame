/**
 * Admin UI Theme
 *
 * Centralized styling tokens for consistent admin interface.
 * Uses STATUS_COLORS from Vecna for semantic status styling,
 * PRIMARY teal for all decorative section icons.
 */

// Re-export Vecna STATUS_COLORS for status badges (published/draft/pending)
export { STATUS_COLORS, getStatusClasses } from '@/lib/vecna/ui-theme'
export type { StatusType } from '@/lib/vecna/ui-theme'

// Section icon styling - ALL decorative icons use primary teal
export const SECTION_ICON_CLASSES = {
  container: 'h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center',
  icon: 'h-4 w-4 text-primary',
} as const

// Helper to get section icon container + icon classes
export function getSectionIconClasses() {
  return {
    container: SECTION_ICON_CLASSES.container,
    icon: SECTION_ICON_CLASSES.icon,
  }
}
