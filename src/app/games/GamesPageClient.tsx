'use client'

import * as React from 'react'
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
} from '@/components/games/filters'
import { useGameFilters } from '@/hooks/use-game-filters'
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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  // Consolidate all filter options
  const options = React.useMemo(
    () => ({
      categories,
      mechanics,
      themes,
      experiences: playerExperiences,
    }),
    [categories, mechanics, themes, playerExperiences]
  )

  // Use consolidated filter hook
  const {
    searchQuery,
    setSearchQuery,
    handleSearch,
    handleClearSearch,
    selected,
    ranges,
    setPlayerCount,
    setPlayTime,
    setWeight,
    handleToggleTaxonomy,
    handleRangeCommit,
    handleRemoveRange,
    handleClearAll,
    activeTaxonomyCount,
  } = useGameFilters({ options, initialSearchQuery })

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <GamesSidebar
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      >
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
              playerCount={ranges.players}
              playTime={ranges.time}
              weight={ranges.weight}
              onPlayerCountChange={setPlayerCount}
              onPlayTimeChange={setPlayTime}
              onWeightChange={setWeight}
              onPlayerCountCommit={(v) => handleRangeCommit('players', v)}
              onPlayTimeCommit={(v) => handleRangeCommit('time', v)}
              onWeightCommit={(v) => handleRangeCommit('weight', v)}
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
              playerCount={ranges.players}
              playTime={ranges.time}
              weight={ranges.weight}
              onToggleTaxonomy={handleToggleTaxonomy}
              onPlayerCountChange={setPlayerCount}
              onPlayTimeChange={setPlayTime}
              onWeightChange={setWeight}
              onPlayerCountCommit={(v) => handleRangeCommit('players', v)}
              onPlayTimeCommit={(v) => handleRangeCommit('time', v)}
              onWeightCommit={(v) => handleRangeCommit('weight', v)}
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
