import { Metadata } from 'next'
import { Suspense } from 'react'

import { GameGrid } from '@/components/games'
import { GameFilters } from '@/components/games/GameFilters'
import { getFilteredGames, getCategories } from '@/lib/supabase/queries'
import { ItemListJsonLd } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'All Games',
  description:
    'Browse our collection of board games with rules summaries, printable score sheets, setup guides, and quick reference cards.',
}

// Mock mechanics for filters (will come from Supabase later)
const mockMechanics = [
  { id: '1', slug: 'worker-placement', name: 'Worker Placement' },
  { id: '2', slug: 'deck-building', name: 'Deck Building' },
  { id: '3', slug: 'area-control', name: 'Area Control' },
  { id: '4', slug: 'tile-placement', name: 'Tile Placement' },
  { id: '5', slug: 'engine-building', name: 'Engine Building' },
  { id: '6', slug: 'drafting', name: 'Drafting' },
  { id: '7', slug: 'set-collection', name: 'Set Collection' },
  { id: '8', slug: 'trading', name: 'Trading' },
]

interface GamesPageProps {
  searchParams: Promise<{
    categories?: string
    mechanics?: string
    players_min?: string
    players_max?: string
    time_min?: string
    time_max?: string
    weight_min?: string
    weight_max?: string
  }>
}

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const params = await searchParams

  // Parse filter parameters
  const filters = {
    categories: params.categories?.split(',').filter(Boolean) || [],
    playersMin: params.players_min ? parseInt(params.players_min) : undefined,
    playersMax: params.players_max ? parseInt(params.players_max) : undefined,
    timeMin: params.time_min ? parseInt(params.time_min) : undefined,
    timeMax: params.time_max ? parseInt(params.time_max) : undefined,
    weightMin: params.weight_min ? parseFloat(params.weight_min) : undefined,
    weightMax: params.weight_max ? parseFloat(params.weight_max) : undefined,
  }

  const hasFilters = filters.categories.length > 0 ||
    filters.playersMin !== undefined ||
    filters.playersMax !== undefined ||
    filters.timeMin !== undefined ||
    filters.timeMax !== undefined ||
    filters.weightMin !== undefined ||
    filters.weightMax !== undefined

  const [games, categories] = await Promise.all([
    getFilteredGames(filters),
    getCategories()
  ])

  return (
    <>
      <ItemListJsonLd
        games={games}
        name="All Board Games"
        description="Browse our collection of board games with rules summaries, printable score sheets, setup guides, and quick reference cards."
      />
      <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          All Games
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse our collection of board games with rules,
          score sheets, and reference materials.
        </p>
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters sidebar */}
        <aside className="w-full shrink-0 lg:w-64">
          <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-lg" />}>
            <GameFilters
              categories={categories}
              mechanics={mockMechanics}
            />
          </Suspense>
        </aside>

        {/* Games grid */}
        <main className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {hasFilters ? `${games.length} games match your filters` : `Showing all ${games.length} games`}
            </p>
          </div>

          {games.length > 0 ? (
            <GameGrid games={games} columns={3} />
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
    </>
  )
}
