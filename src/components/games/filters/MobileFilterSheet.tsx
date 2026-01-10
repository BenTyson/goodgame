'use client'

import * as React from 'react'
import { Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import { FilterSection } from './FilterSection'
import { TaxonomyBadges } from './TaxonomyBadges'
import { TAXONOMY_SECTIONS, RANGE_FILTERS, DEFAULT_OPEN_SECTIONS } from './constants'
import { isRangeDefault, type FilterOption, type TaxonomyType } from './types'

interface MobileFilterSheetProps {
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
  playerCount: [number, number]
  playTime: [number, number]
  weight: [number, number]
  onToggleTaxonomy: (type: TaxonomyType, slug: string) => void
  onPlayerCountChange: (value: [number, number]) => void
  onPlayTimeChange: (value: [number, number]) => void
  onWeightChange: (value: [number, number]) => void
  onPlayerCountCommit: (value: [number, number]) => void
  onPlayTimeCommit: (value: [number, number]) => void
  onWeightCommit: (value: [number, number]) => void
  onClearAll: () => void
  resultsCount: number
  className?: string
}

export function MobileFilterSheet({
  options,
  selected,
  playerCount,
  playTime,
  weight,
  onToggleTaxonomy,
  onPlayerCountChange,
  onPlayTimeChange,
  onWeightChange,
  onPlayerCountCommit,
  onPlayTimeCommit,
  onWeightCommit,
  onClearAll,
  resultsCount,
  className,
}: MobileFilterSheetProps) {
  const [openSections, setOpenSections] = React.useState<string[]>(DEFAULT_OPEN_SECTIONS)
  const [isOpen, setIsOpen] = React.useState(false)

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  // Calculate total active filter count
  const activeFilterCount =
    selected.categories.length +
    selected.mechanics.length +
    selected.themes.length +
    selected.experiences.length +
    (isRangeDefault('players', playerCount[0], playerCount[1]) ? 0 : 1) +
    (isRangeDefault('time', playTime[0], playTime[1]) ? 0 : 1) +
    (isRangeDefault('weight', weight[0], weight[1]) ? 0 : 1)

  const playersConfig = RANGE_FILTERS.find((f) => f.key === 'players')!
  const timeConfig = RANGE_FILTERS.find((f) => f.key === 'time')!
  const weightConfig = RANGE_FILTERS.find((f) => f.key === 'weight')!

  return (
    <div className={cn('lg:hidden', className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 flex flex-col p-0">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-6">
              {/* Range Sliders */}
              <div className="space-y-4">
                {/* Player Count */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <playersConfig.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{playersConfig.label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {playersConfig.formatValue(playerCount[0], playerCount[1])}
                    </span>
                  </div>
                  <Slider
                    value={playerCount}
                    onValueChange={(v) => onPlayerCountChange(v as [number, number])}
                    onValueCommit={(v) => onPlayerCountCommit(v as [number, number])}
                    min={playersConfig.min}
                    max={playersConfig.max}
                    step={playersConfig.step}
                    className="w-full"
                  />
                </div>

                {/* Play Time */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <timeConfig.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{timeConfig.label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {timeConfig.formatValue(playTime[0], playTime[1])}
                    </span>
                  </div>
                  <Slider
                    value={playTime}
                    onValueChange={(v) => onPlayTimeChange(v as [number, number])}
                    onValueCommit={(v) => onPlayTimeCommit(v as [number, number])}
                    min={timeConfig.min}
                    max={timeConfig.max}
                    step={timeConfig.step}
                    className="w-full"
                  />
                </div>

                {/* Weight */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <weightConfig.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{weightConfig.label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {weightConfig.formatValue(weight[0], weight[1])}
                    </span>
                  </div>
                  <Slider
                    value={weight}
                    onValueChange={(v) => onWeightChange(v as [number, number])}
                    onValueCommit={(v) => onWeightCommit(v as [number, number])}
                    min={weightConfig.min}
                    max={weightConfig.max}
                    step={weightConfig.step}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>Light</span>
                    <span>Heavy</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Taxonomy Sections */}
              {TAXONOMY_SECTIONS.map((section) => (
                <FilterSection
                  key={section.key}
                  id={section.key}
                  icon={section.icon}
                  label={section.label}
                  activeCount={selected[section.key].length}
                  isOpen={openSections.includes(section.key)}
                  onOpenChange={() => toggleSection(section.key)}
                >
                  <TaxonomyBadges
                    options={options[section.key]}
                    selected={selected[section.key]}
                    onToggle={(slug) => onToggleTaxonomy(section.key, slug)}
                  />
                </FilterSection>
              ))}
            </div>
          </div>

          <SheetFooter className="px-4 py-3 border-t gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="outline"
                onClick={onClearAll}
                className="flex-1"
              >
                Clear all
              </Button>
            )}
            <Button
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Show {resultsCount} games
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
