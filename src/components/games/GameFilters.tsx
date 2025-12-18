'use client'

import * as React from 'react'
import { Filter, X } from 'lucide-react'

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
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface FilterOption {
  id: string
  slug: string
  name: string
}

interface GameFiltersProps {
  categories: FilterOption[]
  mechanics: FilterOption[]
  className?: string
}

export function GameFilters({
  categories,
  mechanics,
  className,
}: GameFiltersProps) {
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])
  const [selectedMechanics, setSelectedMechanics] = React.useState<string[]>([])
  const [playerCount, setPlayerCount] = React.useState<[number, number]>([1, 8])
  const [playTime, setPlayTime] = React.useState<[number, number]>([0, 180])
  const [weight, setWeight] = React.useState<[number, number]>([1, 5])

  const activeFilterCount =
    selectedCategories.length +
    selectedMechanics.length +
    (playerCount[0] !== 1 || playerCount[1] !== 8 ? 1 : 0) +
    (playTime[0] !== 0 || playTime[1] !== 180 ? 1 : 0) +
    (weight[0] !== 1 || weight[1] !== 5 ? 1 : 0)

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedMechanics([])
    setPlayerCount([1, 8])
    setPlayTime([0, 180])
    setWeight([1, 5])
  }

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    )
  }

  const toggleMechanic = (slug: string) => {
    setSelectedMechanics((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    )
  }

  const filterContent = (
    <div className="space-y-6">
      {/* Active filters */}
      {activeFilterCount > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Active Filters</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((slug) => {
              const cat = categories.find((c) => c.slug === slug)
              return cat ? (
                <Badge
                  key={slug}
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => toggleCategory(slug)}
                >
                  {cat.name}
                  <X className="h-3 w-3" />
                </Badge>
              ) : null
            })}
            {selectedMechanics.map((slug) => {
              const mech = mechanics.find((m) => m.slug === slug)
              return mech ? (
                <Badge
                  key={slug}
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => toggleMechanic(slug)}
                >
                  {mech.name}
                  <X className="h-3 w-3" />
                </Badge>
              ) : null
            })}
          </div>
          <Separator className="mt-4" />
        </div>
      )}

      {/* Categories */}
      <div>
        <h3 className="text-sm font-medium mb-3">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category.slug}
              variant={selectedCategories.includes(category.slug) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleCategory(category.slug)}
            >
              {category.name}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Mechanics */}
      <div>
        <h3 className="text-sm font-medium mb-3">Mechanics</h3>
        <div className="flex flex-wrap gap-2">
          {mechanics.map((mechanic) => (
            <Badge
              key={mechanic.slug}
              variant={selectedMechanics.includes(mechanic.slug) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleMechanic(mechanic.slug)}
            >
              {mechanic.name}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Player Count */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Player Count</h3>
          <span className="text-sm text-muted-foreground">
            {playerCount[0]} - {playerCount[1]}
          </span>
        </div>
        <Slider
          value={playerCount}
          onValueChange={(value) => setPlayerCount(value as [number, number])}
          min={1}
          max={8}
          step={1}
          className="w-full"
        />
      </div>

      <Separator />

      {/* Play Time */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Play Time</h3>
          <span className="text-sm text-muted-foreground">
            {playTime[0]} - {playTime[1] === 180 ? '180+' : playTime[1]} min
          </span>
        </div>
        <Slider
          value={playTime}
          onValueChange={(value) => setPlayTime(value as [number, number])}
          min={0}
          max={180}
          step={15}
          className="w-full"
        />
      </div>

      <Separator />

      {/* Weight/Complexity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Complexity</h3>
          <span className="text-sm text-muted-foreground">
            {weight[0].toFixed(1)} - {weight[1].toFixed(1)}
          </span>
        </div>
        <Slider
          value={weight}
          onValueChange={(value) => setWeight(value as [number, number])}
          min={1}
          max={5}
          step={0.5}
          className="w-full"
        />
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>Light</span>
          <span>Heavy</span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop filters */}
      <div className={cn('hidden lg:block', className)}>
        <div className="sticky top-20 rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4" />
            <h2 className="font-semibold">Filters</h2>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          {filterContent}
        </div>
      </div>

      {/* Mobile filter button and sheet */}
      <div className="lg:hidden">
        <Sheet>
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
          <SheetContent side="left" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              {filterContent}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
