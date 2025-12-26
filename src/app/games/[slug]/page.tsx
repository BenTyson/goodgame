import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import {
  Users,
  Clock,
  Brain,
  Calendar,
  ExternalLink,
  BookOpen,
  FileText,
  ListChecks,
  Bookmark,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ImageGallery, RelatedGamesAsync, RelatedGamesSkeleton, AwardBadgeList, FamilyBadge } from '@/components/games'
import { BuyButtons } from '@/components/monetization'
import { AddToShelfButton } from '@/components/shelf/AddToShelfButton'
import { getGameWithDetails, getAllGameSlugs, getGameAwards, getGameFamily } from '@/lib/supabase/queries'
import { GameJsonLd, BreadcrumbJsonLd } from '@/lib/seo'

interface GamePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { slug } = await params
  const game = await getGameWithDetails(slug)

  if (!game) {
    return {
      title: 'Game Not Found',
    }
  }

  return {
    title: game.name,
    description:
      game.meta_description ||
      `Learn how to play ${game.name}. Get rules summary, printable score sheets, setup guide, and quick reference cards. ${game.tagline}`,
  }
}

export async function generateStaticParams() {
  const slugs = await getAllGameSlugs()
  return slugs.map((slug) => ({ slug }))
}

const contentSections = [
  {
    key: 'has_rules',
    title: 'How to Play',
    description: 'Quick rules summary to get you started',
    icon: BookOpen,
    href: 'rules',
  },
  {
    key: 'has_score_sheet',
    title: 'Score Sheet',
    description: 'Printable PDF for tracking scores',
    icon: FileText,
    href: 'score-sheet',
  },
  {
    key: 'has_setup_guide',
    title: 'Setup Guide',
    description: 'Step-by-step setup with checklist',
    icon: ListChecks,
    href: 'setup',
  },
  {
    key: 'has_reference',
    title: 'Quick Reference',
    description: 'Turn structure and scoring summary',
    icon: Bookmark,
    href: 'reference',
  },
]

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params
  const game = await getGameWithDetails(slug)

  if (!game) {
    notFound()
  }

  const availableSections = contentSections.filter(
    (section) => game[section.key as keyof typeof game]
  )

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Games', href: '/games' },
    { name: game.name, href: `/games/${game.slug}` },
  ]

  const [gameAwards, gameFamily] = await Promise.all([
    getGameAwards(game.id),
    getGameFamily(game.id)
  ])

  return (
    <>
      <GameJsonLd game={game} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <div className="container py-8 md:py-12">
        {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/games" className="hover:text-foreground">
          Games
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{game.name}</span>
      </nav>

      {/* Hero section */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Game images */}
        <div className="lg:col-span-1">
          {game.images && game.images.length > 0 ? (
            <ImageGallery images={game.images} gameName={game.name} />
          ) : (
            <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
              {game.box_image_url ? (
                <Image
                  src={game.box_image_url}
                  alt={game.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <span className="text-8xl font-bold text-primary/40">
                    {game.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Game info */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {game.categories?.map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
              >
                <Badge variant="secondary">{category.name}</Badge>
              </Link>
            ))}
          </div>

          <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {game.name}
          </h1>

          {game.tagline && (
            <p className="mt-2 text-xl text-muted-foreground">{game.tagline}</p>
          )}

          {/* Quick stats */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Players</p>
                <p className="font-medium">
                  {game.player_count_min === game.player_count_max
                    ? game.player_count_min
                    : `${game.player_count_min}-${game.player_count_max}`}
                  {game.player_count_best && game.player_count_best.length > 0 && (
                    <span className="text-muted-foreground">
                      {' '}
                      (best: {game.player_count_best.join(', ')})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {game.play_time_min && (
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Play Time</p>
                  <p className="font-medium">
                    {game.play_time_min === game.play_time_max
                      ? `${game.play_time_min} min`
                      : `${game.play_time_min}-${game.play_time_max} min`}
                  </p>
                </div>
              </div>
            )}

            {game.weight && (
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                <Brain className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Complexity</p>
                  <p className="font-medium">{game.weight.toFixed(1)} / 5</p>
                </div>
              </div>
            )}

            {game.year_published && (
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="font-medium">{game.year_published}</p>
                </div>
              </div>
            )}
          </div>

          {/* Designer & Publisher */}
          {(game.designers_list?.length || game.publishers_list?.length || game.designers?.length || game.publisher) && (
            <div className="mt-4 text-sm text-muted-foreground">
              {/* Use linked designers if available, fall back to text array */}
              {game.designers_list && game.designers_list.length > 0 ? (
                <p>
                  <span className="font-medium text-foreground">Designer:</span>{' '}
                  {game.designers_list.map((designer, idx) => (
                    <span key={designer.id}>
                      <Link
                        href={`/designers/${designer.slug}`}
                        className="hover:text-primary hover:underline"
                      >
                        {designer.name}
                      </Link>
                      {idx < game.designers_list!.length - 1 && ', '}
                    </span>
                  ))}
                </p>
              ) : game.designers && game.designers.length > 0 ? (
                <p>
                  <span className="font-medium text-foreground">Designer:</span>{' '}
                  {game.designers.join(', ')}
                </p>
              ) : null}
              {/* Use linked publishers if available, fall back to text field */}
              {game.publishers_list && game.publishers_list.length > 0 ? (
                <p>
                  <span className="font-medium text-foreground">Publisher:</span>{' '}
                  {game.publishers_list.map((publisher, idx) => (
                    <span key={publisher.id}>
                      <Link
                        href={`/publishers/${publisher.slug}`}
                        className="hover:text-primary hover:underline"
                      >
                        {publisher.name}
                      </Link>
                      {idx < game.publishers_list!.length - 1 && ', '}
                    </span>
                  ))}
                </p>
              ) : game.publisher ? (
                <p>
                  <span className="font-medium text-foreground">Publisher:</span>{' '}
                  {game.publisher}
                </p>
              ) : null}
            </div>
          )}

          {/* Awards */}
          {gameAwards.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-foreground mb-2">Awards</p>
              <AwardBadgeList
                awards={gameAwards}
                variant="compact"
                limit={4}
              />
            </div>
          )}

          {/* Game Family */}
          {gameFamily && (
            <div className="mt-6">
              <FamilyBadge family={gameFamily} />
            </div>
          )}

          {/* Buy buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <BuyButtons
              amazonAsin={game.amazon_asin}
              gameSlug={game.slug}
            />
            <AddToShelfButton gameId={game.id} />
          </div>
        </div>
      </div>

      <Separator className="my-10" />

      {/* Content sections */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-6">
          Game Resources
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {availableSections.map((section) => (
            <Link
              key={section.key}
              href={`/games/${game.slug}/${section.href}`}
              className="group"
            >
              <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5" interactive>
                <CardHeader className="pb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                    <section.icon className="h-6 w-6 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Description */}
      {game.description && (
        <>
          <Separator className="my-10" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">
              About {game.name}
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              {game.description}
            </p>
          </div>
        </>
      )}

      {/* External links */}
      {game.bgg_id && (
        <>
          <Separator className="my-10" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">
              External Links
            </h2>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <a
                  href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  BoardGameGeek
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Related games */}
      <Separator className="my-10" />
      <Suspense fallback={<RelatedGamesSkeleton />}>
        <RelatedGamesAsync gameSlug={game.slug} />
      </Suspense>
      </div>
    </>
  )
}
