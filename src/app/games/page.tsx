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
  const filters = {
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
        />
      </Suspense>
    </>
  )
}

function GamesPageSkeleton() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        <div className="h-5 w-96 bg-muted animate-pulse rounded mt-2" />
      </div>
      <div className="h-12 bg-muted/30 animate-pulse rounded-lg mb-4" />
      <div className="flex gap-6">
        <div className="hidden lg:block w-64 h-96 bg-muted animate-pulse rounded-lg" />
        <div className="flex-1 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
