import { Metadata } from 'next'
import Link from 'next/link'
import { Brain, Users, Gamepad2, HandshakeIcon, UserRound, Grid3X3 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockCategories, mockGames } from '@/data/mock-games'

export const metadata: Metadata = {
  title: 'Game Categories',
  description:
    'Browse board games by category. Strategy, family, party, cooperative, and two-player games with rules, score sheets, and setup guides.',
}

// Icon mapping for categories
const categoryIcons: Record<string, React.ReactNode> = {
  strategy: <Brain className="h-8 w-8" />,
  family: <Users className="h-8 w-8" />,
  party: <Gamepad2 className="h-8 w-8" />,
  cooperative: <HandshakeIcon className="h-8 w-8" />,
  'two-player': <UserRound className="h-8 w-8" />,
}

// Unified primary color for all categories
const categoryStyle = {
  bg: 'bg-primary/10',
  text: 'text-primary',
  border: 'border-border',
  hover: 'hover:border-primary/30'
}

export default function CategoriesPage() {
  // Count games per category
  const categoryCounts = mockCategories.map((category) => ({
    ...category,
    count: mockGames.filter((game) =>
      game.categories.some((cat) => cat.slug === category.slug)
    ).length,
  }))

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
            <p className="text-muted-foreground">
              Browse games by type
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-8 max-w-2xl">
        <p className="text-muted-foreground">
          Find the perfect game for any occasion. Whether you&apos;re looking for deep
          strategy, family fun, party entertainment, or cooperative challenges,
          we&apos;ve got you covered.
        </p>
      </div>

      {/* Categories grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categoryCounts.map((category) => {
          const icon = categoryIcons[category.slug] || <Brain className="h-8 w-8" />

          return (
            <Link key={category.slug} href={`/categories/${category.slug}`}>
              <Card className={`h-full transition-all hover:shadow-md ${categoryStyle.border} ${categoryStyle.hover}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{category.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.count} {category.count === 1 ? 'game' : 'games'}
                      </p>
                    </div>
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${categoryStyle.bg}`}>
                      <span className={categoryStyle.text}>{icon}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {category.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* All Games CTA */}
      <div className="mt-12 text-center">
        <p className="text-muted-foreground mb-4">
          Want to see everything?
        </p>
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
