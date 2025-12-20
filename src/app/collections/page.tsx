import { Metadata } from 'next'
import Link from 'next/link'
import { Library, Sparkles, Clock, Users2, Cog, Brain } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { mockCollections, getCollectionGames } from '@/data/mock-games'

export const metadata: Metadata = {
  title: 'Game Collections',
  description:
    'Browse curated board game collections. Gateway games, quick games, two-player favorites, and more.',
}

// Icon mapping for collections
const collectionIcons: Record<string, React.ReactNode> = {
  'gateway-games': <Sparkles className="h-8 w-8" />,
  'under-30-minutes': <Clock className="h-8 w-8" />,
  'best-at-2-players': <Users2 className="h-8 w-8" />,
  'engine-builders': <Cog className="h-8 w-8" />,
  'heavy-strategy': <Brain className="h-8 w-8" />,
}

export default function CollectionsPage() {
  // Get game counts for each collection
  const collectionsWithCounts = mockCollections
    .filter((c) => c.is_published)
    .map((collection) => ({
      ...collection,
      gameCount: getCollectionGames(collection.slug).length,
    }))
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))

  const featuredCollections = collectionsWithCounts.filter((c) => c.is_featured)
  const otherCollections = collectionsWithCounts.filter((c) => !c.is_featured)

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Library className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Game Collections
            </h1>
            <p className="text-muted-foreground">
              Curated lists for every occasion
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-8 max-w-2xl">
        <p className="text-muted-foreground">
          We&apos;ve hand-picked these collections to help you find the perfect game.
          Whether you&apos;re introducing someone new to the hobby or looking for your
          next strategic challenge, there&apos;s something here for you.
        </p>
      </div>

      {/* Featured Collections */}
      {featuredCollections.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Featured Collections
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCollections.map((collection) => {
              const icon = collectionIcons[collection.slug] || <Library className="h-8 w-8" />

              return (
                <Link key={collection.slug} href={`/collections/${collection.slug}`}>
                  <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{collection.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {collection.gameCount} {collection.gameCount === 1 ? 'game' : 'games'}
                          </p>
                        </div>
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <span className="text-primary">{icon}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {collection.short_description}
                      </p>
                      {collection.is_featured && (
                        <Badge variant="secondary" className="mt-3">
                          Featured
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Other Collections */}
      {otherCollections.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">More Collections</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherCollections.map((collection) => {
              const icon = collectionIcons[collection.slug] || <Library className="h-8 w-8" />

              return (
                <Link key={collection.slug} href={`/collections/${collection.slug}`}>
                  <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{collection.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {collection.gameCount} {collection.gameCount === 1 ? 'game' : 'games'}
                          </p>
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <span className="text-primary">{icon}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {collection.short_description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Browse All CTA */}
      <div className="mt-12 text-center">
        <p className="text-muted-foreground mb-4">
          Looking for something specific?
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
