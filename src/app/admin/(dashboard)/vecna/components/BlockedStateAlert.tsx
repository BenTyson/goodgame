'use client'

import { AlertCircle, FileSearch, Eye, AlertTriangle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VecnaState } from '@/lib/vecna'

interface BlockedStateAlertProps {
  state: VecnaState
  error?: string | null
  onAction?: () => void
  className?: string
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
  // If there's an error, show error alert
  if (error) {
    const styles = variantStyles.error
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
          <h4 className={cn('font-semibold', styles.title)}>Processing Error</h4>
          <p className={cn('text-sm mt-0.5', styles.description)}>{error}</p>
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
