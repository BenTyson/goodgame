import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDesignerBySlug, getGamesByDesigner, getAllDesignerSlugs } from '@/lib/supabase/queries'
import { GameGrid } from '@/components/games'

interface DesignerPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: DesignerPageProps): Promise<Metadata> {
  const { slug } = await params
  const designer = await getDesignerBySlug(slug)

  if (!designer) {
    return {
      title: 'Designer Not Found',
    }
  }

  return {
    title: `${designer.name} - Board Game Designer`,
    description: designer.bio || `Browse board games designed by ${designer.name}.`,
  }
}

export async function generateStaticParams() {
  const slugs = await getAllDesignerSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function DesignerPage({ params }: DesignerPageProps) {
  const { slug } = await params
  const designer = await getDesignerBySlug(slug)

  if (!designer) {
    notFound()
  }

  const games = await getGamesByDesigner(slug)

  return (
    <div className="container py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/designers" className="hover:text-foreground">
          Designers
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{designer.name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {designer.name}
        </h1>
        {designer.bio && (
          <p className="mt-4 text-muted-foreground max-w-3xl">
            {designer.bio}
          </p>
        )}
        {designer.website && (
          <a
            href={designer.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            Visit website
          </a>
        )}
      </div>

      <h2 className="text-2xl font-bold tracking-tight mb-6">
        Games by {designer.name}
      </h2>

      {games.length === 0 ? (
        <p className="text-muted-foreground">No games found for this designer.</p>
      ) : (
        <GameGrid games={games} />
      )}
    </div>
  )
}
