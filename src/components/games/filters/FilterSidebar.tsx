'use client'

import * as React from 'react'
import { Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLocalStorage } from '@/hooks/use-local-storage'

import { FilterSection } from './FilterSection'
import { TaxonomyBadges } from './TaxonomyBadges'
import {
  TAXONOMY_SECTIONS,
  STORAGE_KEYS,
  DEFAULT_OPEN_SECTIONS,
} from './constants'
import type { FilterOption, TaxonomyType } from './types'

interface FilterSidebarProps {
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
  onToggle: (type: TaxonomyType, slug: string) => void
  onClearAll?: () => void
  className?: string
  /** @deprecated No longer needed - embedded mode is the only mode */
  embedded?: boolean
}

export function FilterSidebar({
  options,
  selected,
  onToggle,
  onClearAll,
  className,
}: FilterSidebarProps) {
  const [openSections, setOpenSections] = useLocalStorage<string[]>(
    STORAGE_KEYS.openSections,
    DEFAULT_OPEN_SECTIONS
  )

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  // Calculate active counts for each section
  const activeCounts = {
    categories: selected.categories.length,
    mechanics: selected.mechanics.length,
    themes: selected.themes.length,
    experiences: selected.experiences.length,
  }

  const activeFilterCount =
    activeCounts.categories +
    activeCounts.mechanics +
    activeCounts.themes +
    activeCounts.experiences

  return (
    <div className={cn('space-y-1', className)}>
      {/* Compact Header */}
      <div className="flex items-center justify-between px-2 py-1 mb-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Filters
          </span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && onClearAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-6 px-2 text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Filter sections */}
      {TAXONOMY_SECTIONS.map((section) => (
        <FilterSection
          key={section.key}
          id={section.key}
          icon={section.icon}
          label={section.label}
          activeCount={activeCounts[section.key]}
          isOpen={openSections.includes(section.key)}
          onOpenChange={() => toggleSection(section.key)}
        >
          <TaxonomyBadges
            options={options[section.key]}
            selected={selected[section.key]}
            onToggle={(slug) => onToggle(section.key, slug)}
          />
        </FilterSection>
      ))}
    </div>
  )
}
