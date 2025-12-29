'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import { GameGrid } from '@/components/games/GameGrid'
import {
  FilterBar,
  FilterSidebar,
  ActiveFilters,
  MobileFilterSheet,
  useSidebarCollapsed,
  type FilterOption,
  type TaxonomyType,
  type RangeType,
  DEFAULT_RANGES,
} from '@/components/games/filters'
import type { GameRow, Category } from '@/types/database'

interface GamesPageClientProps {
  games: (GameRow & { categories?: Pick<Category, 'slug' | 'name'>[] })[]
  categories: FilterOption[]
  mechanics: FilterOption[]
  themes: FilterOption[]
  playerExperiences: FilterOption[]
  hasFilters: boolean
}

export function GamesPageClient({
  games,
  categories,
  mechanics,
  themes,
  playerExperiences,
  hasFilters,
}: GamesPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Sidebar collapsed state (shared with FilterSidebar)
  const [sidebarCollapsed] = useSidebarCollapsed()

  // Parse URL params for taxonomy filters
  const selectedCategories = searchParams.get('categories')?.split(',').filter(Boolean) || []
  const selectedMechanics = searchParams.get('mechanics')?.split(',').filter(Boolean) || []
  const selectedThemes = searchParams.get('themes')?.split(',').filter(Boolean) || []
  const selectedExperiences = searchParams.get('experiences')?.split(',').filter(Boolean) || []

  // Parse URL params for range filters
  const playerCountFromUrl: [number, number] = [
    parseInt(searchParams.get('players_min') || '1'),
    parseInt(searchParams.get('players_max') || '8'),
  ]
  const playTimeFromUrl: [number, number] = [
    parseInt(searchParams.get('time_min') || '0'),
    parseInt(searchParams.get('time_max') || '180'),
  ]
  const weightFromUrl: [number, number] = [
    parseFloat(searchParams.get('weight_min') || '1'),
    parseFloat(searchParams.get('weight_max') || '5'),
  ]

  // Local state for sliders (visual feedback during drag)
  const [playerCount, setPlayerCount] = React.useState<[number, number]>(playerCountFromUrl)
  const [playTime, setPlayTime] = React.useState<[number, number]>(playTimeFromUrl)
  const [weight, setWeight] = React.useState<[number, number]>(weightFromUrl)

  // Sync local state when URL changes
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
  const updateFilters = React.useCallback(
    (updates: Record<string, string | null>) => {
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
      window.location.href = newUrl // Force full page reload for server re-render
    },
    [searchParams]
  )

  // Taxonomy toggle handlers
  const handleToggleTaxonomy = (type: TaxonomyType, slug: string) => {
    const currentSelected = {
      categories: selectedCategories,
      mechanics: selectedMechanics,
      themes: selectedThemes,
      experiences: selectedExperiences,
    }

    const newSelected = currentSelected[type].includes(slug)
      ? currentSelected[type].filter((s) => s !== slug)
      : [...currentSelected[type], slug]

    const paramName = type === 'experiences' ? 'experiences' : type
    updateFilters({
      [paramName]: newSelected.length > 0 ? newSelected.join(',') : null,
    })
  }

  // Range commit handlers
  const handlePlayerCountCommit = (value: [number, number]) => {
    const [min, max] = value
    updateFilters({
      players_min: min !== DEFAULT_RANGES.players.min ? String(min) : null,
      players_max: max !== DEFAULT_RANGES.players.max ? String(max) : null,
    })
  }

  const handlePlayTimeCommit = (value: [number, number]) => {
    const [min, max] = value
    updateFilters({
      time_min: min !== DEFAULT_RANGES.time.min ? String(min) : null,
      time_max: max !== DEFAULT_RANGES.time.max ? String(max) : null,
    })
  }

  const handleWeightCommit = (value: [number, number]) => {
    const [min, max] = value
    updateFilters({
      weight_min: min !== DEFAULT_RANGES.weight.min ? String(min) : null,
      weight_max: max !== DEFAULT_RANGES.weight.max ? String(max) : null,
    })
  }

  // Remove range filter (reset to defaults)
  const handleRemoveRange = (type: RangeType) => {
    const paramMap: Record<RangeType, string[]> = {
      players: ['players_min', 'players_max'],
      time: ['time_min', 'time_max'],
      weight: ['weight_min', 'weight_max'],
    }
    const params = paramMap[type]
    updateFilters(Object.fromEntries(params.map((p) => [p, null])))
  }

  // Clear all filters
  const handleClearAll = () => {
    router.push('/games', { scroll: false })
  }

  // Filter options and selected state
  const options = {
    categories,
    mechanics,
    themes,
    experiences: playerExperiences,
  }

  const selected = {
    categories: selectedCategories,
    mechanics: selectedMechanics,
    themes: selectedThemes,
    experiences: selectedExperiences,
  }

  const ranges = {
    players: playerCount,
    time: playTime,
    weight: weight,
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">All Games</h1>
        <p className="mt-2 text-muted-foreground">
          Browse our collection of board games with rules, score sheets, and reference materials.
        </p>
      </div>

      {/* Filter Bar - horizontal range sliders (desktop) */}
      <div className="hidden lg:block mb-4">
        <FilterBar
          playerCount={playerCount}
          playTime={playTime}
          weight={weight}
          onPlayerCountChange={setPlayerCount}
          onPlayTimeChange={setPlayTime}
          onWeightChange={setWeight}
          onPlayerCountCommit={handlePlayerCountCommit}
          onPlayTimeCommit={handlePlayTimeCommit}
          onWeightCommit={handleWeightCommit}
        />
      </div>

      {/* Active Filters Pills */}
      <ActiveFilters
        options={options}
        selected={selected}
        ranges={ranges}
        onRemoveTaxonomy={handleToggleTaxonomy}
        onRemoveRange={handleRemoveRange}
        onClearAll={handleClearAll}
        className="mb-4"
      />

      {/* Mobile filter button */}
      <div className="mb-6">
        <MobileFilterSheet
          options={options}
          selected={selected}
          playerCount={playerCount}
          playTime={playTime}
          weight={weight}
          onToggleTaxonomy={handleToggleTaxonomy}
          onPlayerCountChange={setPlayerCount}
          onPlayTimeChange={setPlayTime}
          onWeightChange={setWeight}
          onPlayerCountCommit={handlePlayerCountCommit}
          onPlayTimeCommit={handlePlayTimeCommit}
          onWeightCommit={handleWeightCommit}
          onClearAll={handleClearAll}
          resultsCount={games.length}
        />
      </div>

      {/* Main content with sidebar */}
      <div className="flex gap-6">
        {/* Collapsible Sidebar - desktop only */}
        <FilterSidebar
          options={options}
          selected={selected}
          onToggle={handleToggleTaxonomy}
          className="hidden lg:block shrink-0"
        />

        {/* Games grid */}
        <main className="flex-1 min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {hasFilters
                ? `${games.length} games match your filters`
                : `Showing all ${games.length} games`}
            </p>
          </div>

          {games.length > 0 ? (
            <GameGrid games={games} sidebarExpanded={!sidebarCollapsed} />
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">
                No games match your filters. Try adjusting your criteria.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
