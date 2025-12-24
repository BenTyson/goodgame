import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublisherBySlug, getGamesByPublisher, getAllPublisherSlugs } from '@/lib/supabase/queries'
import { GameGrid } from '@/components/games'

interface PublisherPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PublisherPageProps): Promise<Metadata> {
  const { slug } = await params
  const publisher = await getPublisherBySlug(slug)

  if (!publisher) {
    return {
      title: 'Publisher Not Found',
    }
  }

  return {
    title: `${publisher.name} - Board Game Publisher`,
    description: publisher.description || `Browse board games published by ${publisher.name}.`,
  }
}

export async function generateStaticParams() {
  const slugs = await getAllPublisherSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function PublisherPage({ params }: PublisherPageProps) {
  const { slug } = await params
  const publisher = await getPublisherBySlug(slug)

  if (!publisher) {
    notFound()
  }

  const games = await getGamesByPublisher(slug)

  return (
    <div className="container py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/publishers" className="hover:text-foreground">
          Publishers
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{publisher.name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {publisher.name}
        </h1>
        {publisher.description && (
          <p className="mt-4 text-muted-foreground max-w-3xl">
            {publisher.description}
          </p>
        )}
        {publisher.website && (
          <a
            href={publisher.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            Visit website
          </a>
        )}
      </div>

      <h2 className="text-2xl font-bold tracking-tight mb-6">
        Games by {publisher.name}
      </h2>

      {games.length === 0 ? (
        <p className="text-muted-foreground">No games found for this publisher.</p>
      ) : (
        <GameGrid games={games} />
      )}
    </div>
  )
}
