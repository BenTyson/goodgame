'use client'

import * as React from 'react'

import { Button } from '@/components/ui/button'
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
  className?: string
}

export function FilterSidebar({
  options,
  selected,
  onToggle,
  className,
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
