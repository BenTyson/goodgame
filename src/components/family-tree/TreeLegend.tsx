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
    <div className={cn('flex flex-wrap gap-3 text-xs text-muted-foreground', className)}>
      <span className="font-medium">Legend:</span>
      {LEGEND_ITEMS.filter(item => item.show).map(({ type }) => {
        const style = RELATION_STYLES[type]
        return (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className={cn(
                'w-4 h-3 rounded-sm',
                style.borderClass.includes('dashed') && 'border-dashed',
                style.borderClass.includes('dotted') && 'border-dotted',
              )}
              style={{
                borderWidth: 2,
                borderColor: style.lineColor,
                borderStyle: style.borderClass.includes('dashed')
                  ? 'dashed'
                  : style.borderClass.includes('dotted')
                    ? 'dotted'
                    : 'solid',
              }}
            />
            <span>{style.label}</span>
          </div>
        )
      })}
    </div>
  )
}
