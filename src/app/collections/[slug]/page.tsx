import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Library, Sparkles, Clock, Users2, Cog, Brain } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GameGrid } from '@/components/games/GameGrid'
import { getCollectionBySlug, getGamesInCollection, getCollections, getAllCollectionSlugs } from '@/lib/supabase/queries'
import { CollectionJsonLd, BreadcrumbJsonLd } from '@/lib/seo'

interface CollectionPageProps {
  params: Promise<{ slug: string }>
}

// Icon mapping for collections
const collectionIcons: Record<string, React.ReactNode> = {
  'gateway-games': <Sparkles className="h-6 w-6" />,
  'under-30-minutes': <Clock className="h-6 w-6" />,
  'best-at-2-players': <Users2 className="h-6 w-6" />,
  'engine-builders': <Cog className="h-6 w-6" />,
  'heavy-strategy': <Brain className="h-6 w-6" />,
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params
  const collection = await getCollectionBySlug(slug)

  if (!collection) {
    return {
      title: 'Collection Not Found',
    }
  }

  return {
    title: collection.meta_title || `${collection.name} - Board Game Collection`,
    description:
      collection.meta_description ||
      `Browse our ${collection.name} collection. ${collection.short_description}`,
  }
}

export async function generateStaticParams() {
  const slugs = await getAllCollectionSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params
  const [collection, gamesInCollection, allCollections] = await Promise.all([
    getCollectionBySlug(slug),
    getGamesInCollection(slug),
    getCollections()
  ])

  if (!collection) {
    notFound()
  }

  const icon = collectionIcons[slug] || <Library className="h-6 w-6" />

  // Get other collections for the "More Collections" section
  const otherCollections = allCollections
    .filter((c) => c.slug !== slug)
    .slice(0, 4)

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Collections', href: '/collections' },
    { name: collection.name, href: `/collections/${collection.slug}` },
  ]

  return (
    <>
      <CollectionJsonLd
        name={collection.name}
        description={collection.description || collection.short_description || ''}
        slug={collection.slug}
        games={gamesInCollection}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <div className="container py-8 md:py-12">
      {/* Breadcrumb & Back */}
      <div className="mb-6 flex items-center justify-between">
        <nav className="text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/collections" className="hover:text-foreground">
            Collections
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{collection.name}</span>
        </nav>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/collections">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Collections
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-primary">{icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {collection.name}
              </h1>
              {collection.is_featured && (
                <Badge variant="secondary">Featured</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {gamesInCollection.length} {gamesInCollection.length === 1 ? 'game' : 'games'} in this collection
            </p>
          </div>
        </div>

        {collection.description && (
          <p className="text-lg text-muted-foreground max-w-3xl">
            {collection.description}
          </p>
        )}
      </div>

      {/* Games Grid */}
      {gamesInCollection.length > 0 ? (
        <GameGrid games={gamesInCollection} />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No games in this collection yet.
          </p>
          <Button variant="outline" asChild>
            <Link href="/games">Browse All Games</Link>
          </Button>
        </div>
      )}

      {/* Other Collections */}
      {otherCollections.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">More Collections</h2>
          <div className="flex flex-wrap gap-3">
            {otherCollections.map((coll) => {
              const collIcon = collectionIcons[coll.slug] || <Library className="h-4 w-4" />

              return (
                <Link
                  key={coll.slug}
                  href={`/collections/${coll.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-primary/5 hover:border-primary/30 transition-colors"
                >
                  <span className="text-primary">{collIcon}</span>
                  <span className="font-medium">{coll.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
      </div>
    </>
  )
}
