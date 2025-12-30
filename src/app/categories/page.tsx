import { Metadata } from 'next'
import Link from 'next/link'
import {
  Brain,
  Users,
  Gamepad2,
  Handshake,
  UserRound,
  Grid3X3,
  Puzzle,
  Target,
  Heart,
  Swords,
  Sparkles,
  Dice5,
  Map,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'

import { getCategoriesWithGameCounts } from '@/lib/supabase/category-queries'

export const metadata: Metadata = {
  title: 'Game Categories',
  description:
    'Browse board games by category. Strategy, family, party, cooperative, and two-player games with rules, score sheets, and setup guides.',
}

// Map DB icon field values to Lucide components
const iconMap: Record<string, LucideIcon> = {
  brain: Brain,
  users: Users,
  gamepad2: Gamepad2,
  handshake: Handshake,
  'user-round': UserRound,
  grid3x3: Grid3X3,
  puzzle: Puzzle,
  target: Target,
  heart: Heart,
  swords: Swords,
  sparkles: Sparkles,
  dice5: Dice5,
  map: Map,
  'message-square': MessageSquare,
}

// Fallback icon for categories without a matching icon
const DefaultIcon = Grid3X3

export default async function CategoriesPage() {
  const categories = await getCategoriesWithGameCounts()

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Grid3X3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Game Categories
            </h1>
            <p className="text-muted-foreground">Browse games by type</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-8 max-w-2xl">
        <p className="text-muted-foreground">
          Find the perfect game for any occasion. Whether you&apos;re looking
          for deep strategy, family fun, party entertainment, or cooperative
          challenges, we&apos;ve got you covered.
        </p>
      </div>

      {/* Categories grid */}
      {categories.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">No categories found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const IconComponent =
              (category.icon && iconMap[category.icon]) || DefaultIcon

            return (
              <Link
                key={category.slug}
                href={`/games?categories=${category.slug}`}
              >
                <div className="group h-full rounded-lg border bg-card p-5 transition-all duration-200 [box-shadow:var(--shadow-card)] hover:[box-shadow:var(--shadow-card-hover)] hover:-translate-y-1 hover:border-primary/30">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {category.name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {category.game_count}{' '}
                        {category.game_count === 1 ? 'game' : 'games'}
                      </p>
                      {category.description && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* All Games CTA */}
      <div className="mt-12 text-center">
        <p className="text-muted-foreground mb-4">Want to see everything?</p>
        <Link
          href="/games"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          Browse All Games
        </Link>
      </div>
    </div>
  )
}
