'use client'

import { AlertCircle, FileSearch, Eye, AlertTriangle, XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VecnaState } from '@/lib/vecna'

interface BlockedStateAlertProps {
  state: VecnaState
  error?: string | null
  onAction?: () => void
  className?: string
}

/**
 * Maps technical error messages to user-friendly explanations with suggested actions
 */
interface ParsedError {
  title: string
  description: string
  suggestion?: string
}

function parseErrorMessage(error: string): ParsedError {
  const errorLower = error.toLowerCase()

  // PDF parsing errors
  if (errorLower.includes('no text') || errorLower.includes('empty text') || errorLower.includes('failed to extract')) {
    return {
      title: 'PDF Text Extraction Failed',
      description: 'The PDF appears to contain scanned images rather than selectable text.',
      suggestion: 'Try a different rulebook source, or find a text-based PDF version.',
    }
  }

  if (errorLower.includes('could not fetch') || errorLower.includes('fetch failed') || errorLower.includes('404')) {
    return {
      title: 'Rulebook Not Found',
      description: 'The rulebook URL returned an error or the file no longer exists.',
      suggestion: 'Verify the URL is correct, or find an alternative rulebook source.',
    }
  }

  if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
    return {
      title: 'Request Timed Out',
      description: 'The operation took too long to complete.',
      suggestion: 'Wait a moment and try again. For large PDFs, this may take longer.',
    }
  }

  // AI/Generation errors
  if (errorLower.includes('rate limit') || errorLower.includes('too many requests')) {
    return {
      title: 'Rate Limit Reached',
      description: 'Too many AI requests in a short time.',
      suggestion: 'Wait 60 seconds before retrying.',
    }
  }

  if (errorLower.includes('content too long') || errorLower.includes('max tokens') || errorLower.includes('context length')) {
    return {
      title: 'Rulebook Too Large',
      description: 'The rulebook is too long for AI processing in a single pass.',
      suggestion: 'Consider using a condensed rulebook or quick-start guide instead.',
    }
  }

  if (errorLower.includes('invalid json') || errorLower.includes('parse error') || errorLower.includes('unexpected token')) {
    return {
      title: 'AI Response Error',
      description: 'The AI returned an invalid response format.',
      suggestion: 'This is usually temporary. Try regenerating the content.',
    }
  }

  // Network errors
  if (errorLower.includes('network') || errorLower.includes('econnrefused') || errorLower.includes('enotfound')) {
    return {
      title: 'Network Error',
      description: 'Could not connect to the required service.',
      suggestion: 'Check your internet connection and try again.',
    }
  }

  // Base game content invalidation
  if (errorLower.includes('base game content updated')) {
    return {
      title: 'Context Outdated',
      description: 'The base game content was updated after this expansion was generated.',
      suggestion: 'Regenerate this expansion to use the updated base game context.',
    }
  }

  // Generic fallback
  return {
    title: 'Processing Error',
    description: error,
    suggestion: undefined,
  }
}

type AlertConfig = {
  title: string
  description: string
  icon: React.ElementType
  actionLabel?: string
  variant: 'warning' | 'info' | 'error'
}

const alertConfigs: Partial<Record<VecnaState, AlertConfig>> = {
  rulebook_missing: {
    title: 'Rulebook Required',
    description: 'A rulebook URL is needed to continue processing this game.',
    icon: FileSearch,
    actionLabel: 'Find Rulebook',
    variant: 'warning',
  },
  review_pending: {
    title: 'Ready for Review',
    description: 'AI-generated content is ready. Review and approve to publish.',
    icon: Eye,
    actionLabel: 'Review Content',
    variant: 'info',
  },
}

const variantStyles = {
  warning: {
    container: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
    border: 'border-l-amber-500',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-800 dark:text-amber-200',
    description: 'text-amber-700 dark:text-amber-300',
    button: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
    border: 'border-l-blue-500',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-200',
    description: 'text-blue-700 dark:text-blue-300',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  error: {
    container: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
    border: 'border-l-red-500',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-800 dark:text-red-200',
    description: 'text-red-700 dark:text-red-300',
    button: 'bg-red-600 hover:bg-red-700 text-white',
  },
}

export function BlockedStateAlert({
  state,
  error,
  onAction,
  className,
}: BlockedStateAlertProps) {
  // If there's an error, show error alert with parsed message
  if (error) {
    const styles = variantStyles.error
    const parsed = parseErrorMessage(error)

    return (
      <div
        className={cn(
          'flex items-start gap-3 p-4 rounded-lg border border-l-4',
          styles.container,
          styles.border,
          className
        )}
      >
        <XCircle className={cn('w-5 h-5 mt-0.5 flex-shrink-0', styles.icon)} />
        <div className="flex-1 min-w-0">
          <h4 className={cn('font-semibold', styles.title)}>{parsed.title}</h4>
          <p className={cn('text-sm mt-0.5', styles.description)}>{parsed.description}</p>
          {parsed.suggestion && (
            <p className={cn('text-sm mt-2 font-medium', styles.description)}>
              Suggestion: {parsed.suggestion}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Get alert config for blocked states
  const config = alertConfigs[state]
  if (!config) return null

  const styles = variantStyles[config.variant]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border border-l-4',
        styles.container,
        styles.border,
        className
      )}
    >
      <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', styles.icon)} />
      <div className="flex-1 min-w-0">
        <h4 className={cn('font-semibold', styles.title)}>{config.title}</h4>
        <p className={cn('text-sm mt-0.5', styles.description)}>{config.description}</p>
      </div>
      {config.actionLabel && onAction && (
        <Button
          size="sm"
          onClick={onAction}
          className={cn('flex-shrink-0', styles.button)}
        >
          {config.actionLabel}
        </Button>
      )}
    </div>
  )
}

// Compact inline badge for list items
export function BlockedBadge({
  state,
  error,
  className,
}: {
  state: VecnaState
  error?: string | null
  className?: string
}) {
  if (error) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
          'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
          className
        )}
      >
        <XCircle className="w-3 h-3" />
        Error
      </span>
    )
  }

  if (state === 'rulebook_missing') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
          'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
          className
        )}
      >
        <AlertTriangle className="w-3 h-3" />
        No Rulebook
      </span>
    )
  }

  if (state === 'review_pending') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
          'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
          className
        )}
      >
        <Eye className="w-3 h-3" />
        Needs Review
      </span>
    )
  }

  return null
}
