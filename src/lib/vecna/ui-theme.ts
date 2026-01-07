/**
 * Vecna Pipeline UI Theme
 *
 * Centralized color tokens for consistent status styling across Vecna components.
 * Uses semantic color naming with full dark mode support.
 */

// Status color tokens - consistent across all Vecna components
export const STATUS_COLORS = {
  // Success - completed, published, ready
  success: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
    icon: 'text-green-600 dark:text-green-400',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  },

  // Warning - needs attention, blocked states
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    icon: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  },

  // Error - critical issues, failures
  error: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    icon: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  },

  // Processing - active operations, blue reserved for this only
  processing: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  },

  // Suggestion/Recommended - should do this, softer than warning
  suggestion: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    icon: 'text-orange-600 dark:text-orange-400',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  },

  // Neutral - optional, informational, low priority
  neutral: {
    bg: 'bg-slate-50 dark:bg-slate-900/50',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-600 dark:text-slate-400',
    icon: 'text-slate-500 dark:text-slate-500',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
} as const

// Importance level mapping (for CompletenessReport)
export const IMPORTANCE_COLORS = {
  critical: STATUS_COLORS.error,
  important: STATUS_COLORS.warning,
  recommended: STATUS_COLORS.suggestion, // Orange, not blue
  optional: STATUS_COLORS.neutral,
} as const

// Helper to get combined classes for a status
export function getStatusClasses(
  status: keyof typeof STATUS_COLORS,
  parts: ('bg' | 'border' | 'text' | 'icon' | 'badge')[] = ['bg', 'border', 'text']
): string {
  const colors = STATUS_COLORS[status]
  return parts.map(part => colors[part]).join(' ')
}

// Helper to get importance classes
export function getImportanceClasses(
  importance: keyof typeof IMPORTANCE_COLORS,
  parts: ('bg' | 'border' | 'text' | 'icon' | 'badge')[] = ['bg', 'border', 'text']
): string {
  const colors = IMPORTANCE_COLORS[importance]
  return parts.map(part => colors[part]).join(' ')
}

// Type exports for consumers
export type StatusType = keyof typeof STATUS_COLORS
export type ImportanceType = keyof typeof IMPORTANCE_COLORS
