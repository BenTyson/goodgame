'use client'

import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Icons, TAXONOMY_SECTIONS, RANGE_FILTERS } from './constants'
import { DEFAULT_RANGES, type FilterOption, type TaxonomyType, type RangeType } from './types'

interface ActiveFiltersProps {
  options: {
    categories: FilterOption[]
    mechanics: FilterOption[]
    themes: FilterOption[]
    experiences: FilterOption[]
  }
  selected: {
    categories: string[]
    mechanics: string[]
    themes: string[]
    experiences: string[]
  }
  ranges: {
    players: [number, number]
    time: [number, number]
    weight: [number, number]
  }
  onRemoveTaxonomy: (type: TaxonomyType, slug: string) => void
  onRemoveRange: (type: RangeType) => void
  onClearAll: () => void
  className?: string
}

export function ActiveFilters({
  options,
  selected,
  ranges,
  onRemoveTaxonomy,
  onRemoveRange,
  onClearAll,
  className,
}: ActiveFiltersProps) {
  // Build list of active filters
  const activeFilters: Array<{
    id: string
    label: string
    type: 'taxonomy' | 'range'
    taxonomyType?: TaxonomyType
    rangeType?: RangeType
    slug?: string
  }> = []

  // Add taxonomy filters
  TAXONOMY_SECTIONS.forEach((section) => {
    selected[section.key].forEach((slug) => {
      const option = options[section.key].find((o) => o.slug === slug)
      if (option) {
        activeFilters.push({
          id: `${section.key}-${slug}`,
          label: option.name,
          type: 'taxonomy',
          taxonomyType: section.key,
          slug,
        })
      }
    })
  })

  // Add range filters (only if not at defaults)
  RANGE_FILTERS.forEach((range) => {
    const currentValue = ranges[range.key]
    const defaults = DEFAULT_RANGES[range.key]
    if (currentValue[0] !== defaults.min || currentValue[1] !== defaults.max) {
      activeFilters.push({
        id: `range-${range.key}`,
        label: `${range.label}: ${range.formatValue(currentValue[0], currentValue[1])}`,
        type: 'range',
        rangeType: range.key,
      })
    }
  })

  if (activeFilters.length === 0) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <ScrollArea className="flex-1">
        <div className="flex items-center gap-2 pb-2">
          {activeFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant="secondary"
              className="shrink-0 gap-1 cursor-pointer hover:bg-secondary/80"
              onClick={() => {
                if (filter.type === 'taxonomy' && filter.taxonomyType && filter.slug) {
                  onRemoveTaxonomy(filter.taxonomyType, filter.slug)
                } else if (filter.type === 'range' && filter.rangeType) {
                  onRemoveRange(filter.rangeType)
                }
              }}
              role="button"
              aria-label={`Remove ${filter.label} filter`}
            >
              {filter.label}
              <Icons.remove className="h-3 w-3" />
            </Badge>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="shrink-0 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        Clear all
      </Button>
    </div>
  )
}
