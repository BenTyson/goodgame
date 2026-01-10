'use client'

import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { FilterOption } from './types'

/** Number of options before wrapping in ScrollArea */
const SCROLL_THRESHOLD = 15

interface TaxonomyBadgesProps {
  options: FilterOption[]
  selected: string[]
  onToggle: (slug: string) => void
  maxHeight?: number
  className?: string
}

export function TaxonomyBadges({
  options,
  selected,
  onToggle,
  maxHeight = 200,
  className,
}: TaxonomyBadgesProps) {
  if (options.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No options available</p>
    )
  }

  const content = (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((option) => {
        const isSelected = selected.includes(option.slug)
        return (
          <Badge
            key={option.slug}
            variant={isSelected ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer transition-colors',
              isSelected && 'bg-primary hover:bg-primary/90'
            )}
            onClick={() => onToggle(option.slug)}
            role="checkbox"
            aria-checked={isSelected}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onToggle(option.slug)
              }
            }}
          >
            {option.name}
          </Badge>
        )
      })}
    </div>
  )

  // Use ScrollArea only if we have many options
  if (options.length > SCROLL_THRESHOLD) {
    return (
      <ScrollArea className="pr-2" style={{ maxHeight }}>
        {content}
      </ScrollArea>
    )
  }

  return content
}
