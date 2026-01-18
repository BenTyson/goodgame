'use client'

import { cn } from '@/lib/utils'
import { RELATION_STYLES } from './types'
import type { RelationType } from '@/types/database'

const LEGEND_ITEMS: { type: RelationType | 'base'; show: boolean }[] = [
  { type: 'base', show: true },
  { type: 'expansion_of', show: true },
  { type: 'standalone_in_series', show: true },
  { type: 'spin_off_of', show: true },
  { type: 'sequel_to', show: true },
  { type: 'prequel_to', show: true },
  { type: 'reimplementation_of', show: true },
]

export function TreeLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-3 px-4 py-2',
        'rounded-full backdrop-blur-sm',
        'bg-card/80 border border-border/50',
        'shadow-sm',
        className
      )}
    >
      {LEGEND_ITEMS.filter(item => item.show).map(({ type }) => {
        const style = RELATION_STYLES[type]
        const isDashed = style.borderClass.includes('dashed')

        return (
          <div key={type} className="flex items-center gap-1.5">
            {/* Color indicator dot */}
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: style.lineColor,
                boxShadow: isDashed
                  ? `0 0 0 1px var(--background), 0 0 0 2px ${style.lineColor}`
                  : `0 0 6px ${style.lineColor}40`,
              }}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {style.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
