import { Metadata } from 'next'
import { Suspense } from 'react'

import { GameGrid } from '@/components/games'
import { GameFilters } from '@/components/games/GameFilters'
import { mockGames, mockCategories } from '@/data/mock-games'
import { ItemListJsonLd } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'All Games',
  description:
    'Browse our collection of board games with rules summaries, printable score sheets, setup guides, and quick reference cards.',
}

// Mock mechanics for filters
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

export default function GamesPage() {
  return (
    <>
      <ItemListJsonLd
        games={mockGames}
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
          Browse our collection of {mockGames.length} board games with rules,
          score sheets, and reference materials.
        </p>
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters sidebar */}
        <aside className="w-full shrink-0 lg:w-64">
          <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-lg" />}>
            <GameFilters
              categories={mockCategories}
              mechanics={mockMechanics}
            />
          </Suspense>
        </aside>

        {/* Games grid */}
        <main className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {mockGames.length} games
            </p>
          </div>

          <GameGrid games={mockGames} columns={3} />
        </main>
      </div>
      </div>
    </>
  )
}
