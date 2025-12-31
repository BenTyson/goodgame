'use client'

import * as React from 'react'
import { Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useLocalStorage } from '@/hooks/use-local-storage'

import { FilterSection } from './FilterSection'
import { FilterRail } from './FilterRail'
import { TaxonomyBadges } from './TaxonomyBadges'
import {
  TAXONOMY_SECTIONS,
  STORAGE_KEYS,
  DEFAULT_OPEN_SECTIONS,
  Icons,
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
  /** When true, renders without outer wrapper for embedding in GamesSidebar */
  embedded?: boolean
}

export function FilterSidebar({
  options,
  selected,
  onToggle,
  onClearAll,
  className,
  embedded = false,
}: FilterSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    STORAGE_KEYS.sidebarCollapsed,
    false
  )
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

  const handleSectionClick = (sectionKey: string) => {
    // Expand sidebar and open/focus that section
    setIsCollapsed(false)
    if (!openSections.includes(sectionKey)) {
      setOpenSections((prev) => [...prev, sectionKey])
    }
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

  // Filter sections content - shared between embedded and standalone modes
  const filterSections = (
    <>
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
    </>
  )

  // Embedded mode: just render filter sections with compact header
  if (embedded) {
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
        {filterSections}
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          'sticky top-20 transition-[width] duration-200 ease-out',
          isCollapsed ? 'w-14' : 'w-64',
          className
        )}
      >
        {isCollapsed ? (
          <FilterRail
            activeCounts={activeCounts}
            onExpand={() => setIsCollapsed(false)}
            onSectionClick={handleSectionClick}
          />
        ) : (
          <div className="rounded-lg border bg-card">
            {/* Header with collapse button */}
            <div className="flex items-center justify-between border-b p-3">
              <div className="flex items-center gap-2">
                <Icons.categories className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Filters</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(true)}
                className="h-8 w-8"
                aria-label="Collapse filters"
              >
                <Icons.collapse className="h-4 w-4" />
              </Button>
            </div>

            {/* Filter sections */}
            <div className="p-2">
              {filterSections}
            </div>
          </div>
        )}
      </aside>
    </TooltipProvider>
  )
}

// Export the collapsed state hook for use by other components
export function useSidebarCollapsed() {
  return useLocalStorage(STORAGE_KEYS.sidebarCollapsed, false)
}
