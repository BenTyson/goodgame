import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import {
  Users,
  Clock,
  Calendar,
  ExternalLink,
  BookOpen,
  FileText,
  ListChecks,
  Bookmark,
  Building2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  ImageGallery,
  RelatedGamesAsync,
  RelatedGamesSkeleton,
  AwardBadgeList,
  TaxonomySection,
  CategoryBadges,
  ComplexityDisplay,
  AgeRating,
  CreditsSection,
  ComponentsList,
  WikipediaGameplay,
  WikipediaReception,
  GameRelationsSection,
} from '@/components/games'
import { BuyButtons } from '@/components/monetization'
import { AddToShelfButton } from '@/components/shelf/AddToShelfButton'
import { ReviewSection, AggregateRating } from '@/components/reviews'
import { getGameWithDetails, getAllGameSlugs, getGameAwards } from '@/lib/supabase/queries'
import { getGameRelationsGrouped } from '@/lib/supabase/family-queries'
import { getGameReviews, getGameAggregateRating } from '@/lib/supabase/user-queries'
import { GameJsonLd, BreadcrumbJsonLd } from '@/lib/seo'
import { getInitials, getInitialsColor } from '@/components/publishers'
import type { CrunchBreakdown, ComponentList as ComponentListType } from '@/types/database'

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

  // Parallel data fetching
  const [gameAwards, gameRelations, reviewsData, aggregateRating] = await Promise.all([
    getGameAwards(game.id),
    getGameRelationsGrouped(game.id),
    getGameReviews(game.id),
    getGameAggregateRating(game.id),
  ])

  // Check for available data
  const hasRelations = gameRelations.baseGame || gameRelations.expansions.length > 0 || gameRelations.otherRelations.length > 0
  const hasWikipediaContent = game.wikipedia_gameplay || game.wikipedia_reception
  const hasComponentList = game.component_list && Object.keys(game.component_list as object).length > 0

  return (
    <>
      <GameJsonLd game={game} />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <div className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/games" className="hover:text-foreground transition-colors">
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
                {game.wikidata_image_url ? (
                  <Image
                    src={game.wikidata_image_url}
                    alt={game.name}
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                  />
                ) : game.box_image_url ? (
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
          <div className="lg:col-span-2 space-y-6">
            {/* Categories (primary taxonomy) */}
            {game.categories && game.categories.length > 0 && (
              <CategoryBadges categories={game.categories} limit={4} />
            )}

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                {game.name}
              </h1>
              {game.tagline && (
                <p className="mt-2 text-xl text-muted-foreground">{game.tagline}</p>
              )}
            </div>

            {/* Community Rating */}
            {aggregateRating.count > 0 && (
              <AggregateRating
                average={aggregateRating.average}
                count={aggregateRating.count}
              />
            )}

            {/* Quick stats */}
            <div className="flex flex-wrap gap-3">
              {/* Players */}
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Players</p>
                  <p className="font-medium">
                    {game.player_count_min === game.player_count_max
                      ? game.player_count_min
                      : `${game.player_count_min}-${game.player_count_max}`}
                    {game.player_count_best && game.player_count_best.length > 0 && (
                      <span className="text-sm text-muted-foreground ml-1">
                        (best: {game.player_count_best.join(', ')})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Play Time */}
              {game.play_time_min && (
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Play Time</p>
                    <p className="font-medium">
                      {game.play_time_min === game.play_time_max
                        ? `${game.play_time_min} min`
                        : `${game.play_time_min}-${game.play_time_max} min`}
                    </p>
                  </div>
                </div>
              )}

              {/* Complexity - using ComplexityDisplay component */}
              {(game.crunch_score || game.weight) && (
                <ComplexityDisplay
                  crunchScore={game.crunch_score}
                  crunchBreakdown={game.crunch_breakdown as CrunchBreakdown | null}
                  weight={game.weight}
                  complexityTier={game.complexity_tier}
                  variant="badge"
                />
              )}

              {/* Age Rating */}
              {game.min_age && (
                <AgeRating age={game.min_age} variant="badge" />
              )}

              {/* Year Published */}
              {game.year_published && (
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2.5">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Published</p>
                    <p className="font-medium">{game.year_published}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Credits - Designers, Artists, Publishers */}
            <CreditsSection
              designers={game.designers_list}
              artists={game.artists_list}
              publishers={game.publishers_list}
              variant="compact"
              limit={4}
            />

            {/* Awards */}
            {gameAwards.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Awards</p>
                <AwardBadgeList
                  awards={gameAwards}
                  variant="compact"
                  limit={4}
                />
              </div>
            )}

            {/* Game Family */}
            {gameRelations.family && !gameRelations.baseGame && (
              <GameRelationsSection
                baseGame={null}
                expansions={[]}
                otherRelations={[]}
                family={gameRelations.family}
                variant="compact"
              />
            )}

            {/* Buy buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <BuyButtons
                amazonAsin={game.amazon_asin}
                gameSlug={game.slug}
              />
              <AddToShelfButton gameId={game.id} />
            </div>
          </div>
        </div>

        {/* Full Taxonomy Section (all 4 dimensions) */}
        {(game.mechanics?.length > 0 || game.themes?.length > 0 || game.player_experiences?.length > 0) && (
          <>
            <Separator className="my-10" />
            <div>
              <h2 className="text-lg font-semibold tracking-tight mb-4">
                Game Classification
              </h2>
              <TaxonomySection
                categories={game.categories}
                mechanics={game.mechanics}
                themes={game.themes}
                playerExperiences={game.player_experiences}
                collapseAfter={6}
              />
            </div>
          </>
        )}

        {/* Game Relations Section */}
        {hasRelations && (
          <>
            <Separator className="my-10" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-6">
                {gameRelations.baseGame ? 'This is an Expansion' : 'Related Games'}
              </h2>
              <GameRelationsSection
                baseGame={gameRelations.baseGame}
                expansions={gameRelations.expansions}
                otherRelations={gameRelations.otherRelations}
                family={gameRelations.family}
              />
            </div>
          </>
        )}

        {/* Content sections */}
        {availableSections.length > 0 && (
          <>
            <Separator className="my-10" />
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
                    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5">
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
          </>
        )}

        {/* About Section with Description + Wikipedia + Components */}
        {(game.description || hasWikipediaContent || hasComponentList) && (
          <>
            <Separator className="my-10" />
            <div className="space-y-8">
              <h2 className="text-2xl font-bold tracking-tight">
                About {game.name}
              </h2>

              {/* Description */}
              {game.description && (
                <p className="text-muted-foreground leading-relaxed max-w-3xl">
                  {game.description}
                </p>
              )}

              {/* Wikipedia Gameplay */}
              {game.wikipedia_gameplay && (
                <WikipediaGameplay
                  gameplay={game.wikipedia_gameplay}
                  wikipediaUrl={game.wikipedia_url}
                />
              )}

              {/* Components List */}
              {hasComponentList && (
                <ComponentsList
                  components={game.component_list as ComponentListType}
                  variant="grid"
                />
              )}
            </div>
          </>
        )}

        {/* Reception Section (Wikipedia) */}
        {game.wikipedia_reception && (
          <>
            <Separator className="my-10" />
            <WikipediaReception
              reception={game.wikipedia_reception}
              wikipediaUrl={game.wikipedia_url}
            />
          </>
        )}

        {/* About the Publisher */}
        {game.publishers_list && game.publishers_list.length > 0 && (
          <>
            <Separator className="my-10" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-6">
                About the Publisher{game.publishers_list.length > 1 ? 's' : ''}
              </h2>
              <div className="space-y-6">
                {game.publishers_list.map((publisher) => {
                  const initials = getInitials(publisher.name)
                  const colorClass = getInitialsColor(publisher.name)
                  return (
                    <div key={publisher.id} className="flex flex-col sm:flex-row gap-6">
                      {/* Publisher Logo/Initials */}
                      <div className="shrink-0">
                        {publisher.logo_url ? (
                          <Image
                            src={publisher.logo_url}
                            alt={publisher.name}
                            width={80}
                            height={80}
                            className="rounded-xl object-contain"
                          />
                        ) : (
                          <div className={`flex h-20 w-20 items-center justify-center rounded-xl ${colorClass} text-white font-bold text-2xl`}>
                            {initials}
                          </div>
                        )}
                      </div>

                      {/* Publisher Info */}
                      <div className="flex-1">
                        <Link
                          href={`/publishers/${publisher.slug}`}
                          className="text-xl font-semibold hover:text-primary transition-colors"
                        >
                          {publisher.name}
                        </Link>
                        {publisher.description ? (
                          <p className="mt-2 text-muted-foreground leading-relaxed max-w-2xl">
                            {publisher.description}
                          </p>
                        ) : (
                          <p className="mt-2 text-muted-foreground leading-relaxed max-w-2xl">
                            {publisher.name} is a board game publisher known for creating engaging tabletop experiences.
                          </p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/publishers/${publisher.slug}`} className="gap-2">
                              <Building2 className="h-4 w-4" />
                              View All Games
                            </Link>
                          </Button>
                          {publisher.website && (
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={publisher.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="gap-2"
                              >
                                Visit Website
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Reviews Section */}
        <Separator className="my-10" />
        <ReviewSection
          gameId={game.id}
          gameName={game.name}
          initialReviews={reviewsData.reviews}
          initialHasMore={reviewsData.hasMore}
        />

        {/* External links */}
        {(game.bgg_id || game.official_website || game.rulebook_url) && (
          <>
            <Separator className="my-10" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-4">
                External Links
              </h2>
              <div className="flex flex-wrap gap-3">
                {game.official_website && (
                  <Button variant="outline" asChild>
                    <a
                      href={game.official_website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2"
                    >
                      Official Website
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {game.rulebook_url && (
                  <Button variant="outline" asChild>
                    <a
                      href={game.rulebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      Official Rulebook
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {game.bgg_id && (
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
                )}
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
