'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { TAXONOMY_SECTIONS, Icons } from './constants'

interface FilterRailProps {
  activeCounts: Record<string, number>
  onExpand: () => void
  onSectionClick?: (sectionKey: string) => void
  className?: string
}

export function FilterRail({
  activeCounts,
  onExpand,
  onSectionClick,
  className,
}: FilterRailProps) {
  const totalActive = Object.values(activeCounts).reduce((sum, count) => sum + count, 0)

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 rounded-lg border bg-card/80 p-2',
        className
      )}
    >
      {/* Expand button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onExpand}
            className="h-9 w-9 relative"
            aria-label={`Expand filters${totalActive > 0 ? ` (${totalActive} active)` : ''}`}
          >
            <Icons.expand className="h-4 w-4" />
            {totalActive > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                {totalActive}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Expand filters</p>
        </TooltipContent>
      </Tooltip>

      <div className="my-1 h-px w-6 bg-border" />

      {/* Section icons */}
      {TAXONOMY_SECTIONS.map((section) => {
        const Icon = section.icon
        const count = activeCounts[section.key] || 0

        return (
          <Tooltip key={section.key}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onSectionClick?.(section.key)}
                className="h-9 w-9 relative"
                aria-label={`${section.label}${count > 0 ? ` (${count} active)` : ''}`}
              >
                <Icon className="h-4 w-4" />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/10 px-1 text-[10px] font-medium text-primary">
                    {count}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{section.label}{count > 0 ? ` (${count})` : ''}</p>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
