import { Metadata } from 'next'
import { Suspense } from 'react'

import { GamesPageClient } from './GamesPageClient'
import { getFilteredGames, getCategories, getMechanics, getThemes, getPlayerExperiences } from '@/lib/supabase/queries'
import { ItemListJsonLd } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'All Games',
  description:
    'Browse our collection of board games with rules summaries, printable score sheets, setup guides, and quick reference cards.',
}

interface GamesPageProps {
  searchParams: Promise<{
    q?: string
    categories?: string
    mechanics?: string
    themes?: string
    experiences?: string
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
  const searchQuery = params.q?.trim() || ''
  const filters = {
    query: searchQuery || undefined,
    categories: params.categories?.split(',').filter(Boolean) || [],
    mechanics: params.mechanics?.split(',').filter(Boolean) || [],
    themes: params.themes?.split(',').filter(Boolean) || [],
    experiences: params.experiences?.split(',').filter(Boolean) || [],
    playersMin: params.players_min ? parseInt(params.players_min) : undefined,
    playersMax: params.players_max ? parseInt(params.players_max) : undefined,
    timeMin: params.time_min ? parseInt(params.time_min) : undefined,
    timeMax: params.time_max ? parseInt(params.time_max) : undefined,
    weightMin: params.weight_min ? parseFloat(params.weight_min) : undefined,
    weightMax: params.weight_max ? parseFloat(params.weight_max) : undefined,
  }

  const hasFilters =
    !!searchQuery ||
    filters.categories.length > 0 ||
    filters.mechanics.length > 0 ||
    filters.themes.length > 0 ||
    filters.experiences.length > 0 ||
    filters.playersMin !== undefined ||
    filters.playersMax !== undefined ||
    filters.timeMin !== undefined ||
    filters.timeMax !== undefined ||
    filters.weightMin !== undefined ||
    filters.weightMax !== undefined

  const [games, categories, mechanics, themes, playerExperiences] = await Promise.all([
    getFilteredGames(filters),
    getCategories(),
    getMechanics(),
    getThemes(),
    getPlayerExperiences(),
  ])

  // Transform to FilterOption format
  const categoryOptions = categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name }))
  const mechanicOptions = mechanics.map((m) => ({ id: m.id, slug: m.slug, name: m.name }))
  const themeOptions = themes.map((t) => ({ id: t.id, slug: t.slug, name: t.name }))
  const experienceOptions = playerExperiences.map((e) => ({ id: e.id, slug: e.slug, name: e.name }))

  return (
    <>
      <ItemListJsonLd
        games={games}
        name="All Board Games"
        description="Browse our collection of board games with rules summaries, printable score sheets, setup guides, and quick reference cards."
      />
      <Suspense fallback={<GamesPageSkeleton />}>
        <GamesPageClient
          games={games}
          categories={categoryOptions}
          mechanics={mechanicOptions}
          themes={themeOptions}
          playerExperiences={experienceOptions}
          hasFilters={hasFilters}
          initialSearchQuery={searchQuery}
        />
      </Suspense>
    </>
  )
}

function GamesPageSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Skeleton */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-muted/50 border-r flex-shrink-0">
        <div className="px-4 py-4 border-b">
          <div className="h-6 w-24 bg-muted animate-pulse rounded" />
        </div>
        <div className="p-4 space-y-4">
          <div className="h-5 w-16 bg-muted animate-pulse rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 min-w-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px]">
          {/* Search Bar Skeleton */}
          <div className="h-12 bg-muted animate-pulse rounded-xl mb-6" />
          {/* Filter Bar Skeleton */}
          <div className="hidden lg:block h-12 bg-muted/30 animate-pulse rounded-lg mb-4" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
