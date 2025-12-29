'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  themes: FilterOption[]
  playerExperiences: FilterOption[]
  className?: string
}

export function GameFilters({
  categories,
  mechanics,
  themes,
  playerExperiences,
  className,
}: GameFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Read filter values from URL
  const selectedCategories = searchParams.get('categories')?.split(',').filter(Boolean) || []
  const selectedMechanics = searchParams.get('mechanics')?.split(',').filter(Boolean) || []
  const selectedThemes = searchParams.get('themes')?.split(',').filter(Boolean) || []
  const selectedExperiences = searchParams.get('experiences')?.split(',').filter(Boolean) || []

  // Parse URL params for initial/committed values
  const playerCountFromUrl: [number, number] = [
    parseInt(searchParams.get('players_min') || '1'),
    parseInt(searchParams.get('players_max') || '8')
  ]
  const playTimeFromUrl: [number, number] = [
    parseInt(searchParams.get('time_min') || '0'),
    parseInt(searchParams.get('time_max') || '180')
  ]
  const weightFromUrl: [number, number] = [
    parseFloat(searchParams.get('weight_min') || '1'),
    parseFloat(searchParams.get('weight_max') || '5')
  ]

  // Local state for sliders (allows visual feedback during dragging)
  const [playerCount, setPlayerCount] = React.useState<[number, number]>(playerCountFromUrl)
  const [playTime, setPlayTime] = React.useState<[number, number]>(playTimeFromUrl)
  const [weight, setWeight] = React.useState<[number, number]>(weightFromUrl)

  // Sync local state when URL changes (e.g., clear all filters)
  React.useEffect(() => {
    setPlayerCount(playerCountFromUrl)
  }, [playerCountFromUrl[0], playerCountFromUrl[1]])

  React.useEffect(() => {
    setPlayTime(playTimeFromUrl)
  }, [playTimeFromUrl[0], playTimeFromUrl[1]])

  React.useEffect(() => {
    setWeight(weightFromUrl)
  }, [weightFromUrl[0], weightFromUrl[1]])

  // Update URL with new filters
  const updateFilters = React.useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    const queryString = params.toString()
    const newUrl = queryString ? `/games?${queryString}` : '/games'
    console.log('Updating filters, new URL:', newUrl) // Debug
    window.location.href = newUrl // Force full page reload to ensure server re-renders
  }, [searchParams])

  const activeFilterCount =
    selectedCategories.length +
    selectedMechanics.length +
    selectedThemes.length +
    selectedExperiences.length +
    (playerCount[0] !== 1 || playerCount[1] !== 8 ? 1 : 0) +
    (playTime[0] !== 0 || playTime[1] !== 180 ? 1 : 0) +
    (weight[0] !== 1 || weight[1] !== 5 ? 1 : 0)

  const clearAllFilters = () => {
    router.push('/games', { scroll: false })
  }

  const toggleCategory = (slug: string) => {
    const newCategories = selectedCategories.includes(slug)
      ? selectedCategories.filter((s) => s !== slug)
      : [...selectedCategories, slug]

    updateFilters({
      categories: newCategories.length > 0 ? newCategories.join(',') : null
    })
  }

  const toggleMechanic = (slug: string) => {
    const newMechanics = selectedMechanics.includes(slug)
      ? selectedMechanics.filter((s) => s !== slug)
      : [...selectedMechanics, slug]

    updateFilters({
      mechanics: newMechanics.length > 0 ? newMechanics.join(',') : null
    })
  }

  const toggleTheme = (slug: string) => {
    const newThemes = selectedThemes.includes(slug)
      ? selectedThemes.filter((s) => s !== slug)
      : [...selectedThemes, slug]

    updateFilters({
      themes: newThemes.length > 0 ? newThemes.join(',') : null
    })
  }

  const toggleExperience = (slug: string) => {
    const newExperiences = selectedExperiences.includes(slug)
      ? selectedExperiences.filter((s) => s !== slug)
      : [...selectedExperiences, slug]

    updateFilters({
      experiences: newExperiences.length > 0 ? newExperiences.join(',') : null
    })
  }

  const handlePlayerCountCommit = (value: number[]) => {
    const [min, max] = value as [number, number]
    updateFilters({
      players_min: min !== 1 ? String(min) : null,
      players_max: max !== 8 ? String(max) : null,
    })
  }

  const handlePlayTimeCommit = (value: number[]) => {
    const [min, max] = value as [number, number]
    updateFilters({
      time_min: min !== 0 ? String(min) : null,
      time_max: max !== 180 ? String(max) : null,
    })
  }

  const handleWeightCommit = (value: number[]) => {
    const [min, max] = value as [number, number]
    updateFilters({
      weight_min: min !== 1 ? String(min) : null,
      weight_max: max !== 5 ? String(max) : null,
    })
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
            {selectedThemes.map((slug) => {
              const theme = themes.find((t) => t.slug === slug)
              return theme ? (
                <Badge
                  key={slug}
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => toggleTheme(slug)}
                >
                  {theme.name}
                  <X className="h-3 w-3" />
                </Badge>
              ) : null
            })}
            {selectedExperiences.map((slug) => {
              const exp = playerExperiences.find((e) => e.slug === slug)
              return exp ? (
                <Badge
                  key={slug}
                  variant="secondary"
                  className="gap-1 cursor-pointer"
                  onClick={() => toggleExperience(slug)}
                >
                  {exp.name}
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

      {/* Themes */}
      <div>
        <h3 className="text-sm font-medium mb-3">Themes</h3>
        <div className="flex flex-wrap gap-2">
          {themes.map((theme) => (
            <Badge
              key={theme.slug}
              variant={selectedThemes.includes(theme.slug) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleTheme(theme.slug)}
            >
              {theme.name}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Player Experiences */}
      <div>
        <h3 className="text-sm font-medium mb-3">Play Style</h3>
        <div className="flex flex-wrap gap-2">
          {playerExperiences.map((exp) => (
            <Badge
              key={exp.slug}
              variant={selectedExperiences.includes(exp.slug) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => toggleExperience(exp.slug)}
            >
              {exp.name}
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
          onValueChange={(v) => setPlayerCount(v as [number, number])}
          onValueCommit={handlePlayerCountCommit}
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
          onValueChange={(v) => setPlayTime(v as [number, number])}
          onValueCommit={handlePlayTimeCommit}
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
          onValueChange={(v) => setWeight(v as [number, number])}
          onValueCommit={handleWeightCommit}
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
