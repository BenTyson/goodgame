'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { GameCondition } from '@/types/marketplace'
import { CONDITION_INFO } from '@/types/marketplace'

interface ConditionBadgeProps {
  condition: GameCondition | null | undefined
  variant?: 'default' | 'compact'
  className?: string
}

export function ConditionBadge({
  condition,
  variant = 'default',
  className,
}: ConditionBadgeProps) {
  if (!condition) return null

  const info = CONDITION_INFO[condition]

  return (
    <Badge
      variant="secondary"
      className={cn(
        'font-medium shadow-sm',
        variant === 'compact' && 'text-[10px] px-1.5 py-0',
        // Color based on condition
        condition === 'new_sealed' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        condition === 'like_new' && 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
        condition === 'very_good' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        condition === 'good' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        condition === 'acceptable' && 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        className
      )}
    >
      {info.label}
    </Badge>
  )
}

/**
 * Standalone condition display with description
 */
export function ConditionDisplay({
  condition,
  showDescription = false,
}: {
  condition: GameCondition | null | undefined
  showDescription?: boolean
}) {
  if (!condition) return null

  const info = CONDITION_INFO[condition]

  return (
    <div className="flex flex-col gap-1">
      <ConditionBadge condition={condition} />
      {showDescription && (
        <p className="text-xs text-muted-foreground">{info.description}</p>
      )}
    </div>
  )
}
