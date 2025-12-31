'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Menu, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GameGrid } from '@/components/games/GameGrid'
import { GamesSidebar } from '@/components/games/GamesSidebar'
import {
  FilterBar,
  FilterSidebar,
  ActiveFilters,
  MobileFilterSheet,
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
  initialSearchQuery?: string
}

export function GamesPageClient({
  games,
  categories,
  mechanics,
  themes,
  playerExperiences,
  hasFilters,
  initialSearchQuery = '',
}: GamesPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState(initialSearchQuery)

  // Sync search query when URL changes
  React.useEffect(() => {
    setSearchQuery(searchParams.get('q') || '')
  }, [searchParams])

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
    setSearchQuery('')
    router.push('/games', { scroll: false })
  }

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim())
    } else {
      params.delete('q')
    }
    const queryString = params.toString()
    const newUrl = queryString ? `/games?${queryString}` : '/games'
    window.location.href = newUrl
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    const queryString = params.toString()
    const newUrl = queryString ? `/games?${queryString}` : '/games'
    window.location.href = newUrl
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

  // Count active taxonomy filters for mobile badge
  const activeTaxonomyCount =
    selectedCategories.length +
    selectedMechanics.length +
    selectedThemes.length +
    selectedExperiences.length

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <GamesSidebar
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      >
        {/* Filter content inside sidebar */}
        <FilterSidebar
          options={options}
          selected={selected}
          onToggle={handleToggleTaxonomy}
          onClearAll={handleClearAll}
          embedded
        />
      </GamesSidebar>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-background border-b px-4 py-3 flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            className="relative"
          >
            <Menu className="h-5 w-5" />
            {activeTaxonomyCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center">
                {activeTaxonomyCount}
              </span>
            )}
          </Button>
          <h1 className="text-lg font-semibold">Games</h1>
        </div>

        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px]">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for a game..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-12 pr-12 text-lg rounded-xl border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>

          {/* Filter Bar - horizontal range sliders */}
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
          <div className="lg:hidden mb-4">
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

          {/* Results count */}
          <div className="mb-4 flex items-center justify-between border-b pb-4">
            <p className="text-sm text-muted-foreground">
              {hasFilters
                ? `${games.length} games match your filters`
                : `Showing all ${games.length} games`}
            </p>
          </div>

          {/* Games grid */}
          {games.length > 0 ? (
            <GameGrid games={games} sidebarExpanded={true} />
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">
                No games match your filters. Try adjusting your criteria.
              </p>
              <Button variant="outline" onClick={handleClearAll} className="mt-4">
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
