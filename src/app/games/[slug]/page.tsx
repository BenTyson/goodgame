import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  GameHero,
  GamePageTabs,
  OverviewTab,
  RulesTab,
  SetupTab,
  ScoreSheetTab,
} from '@/components/games'
import { getGameWithDetails, getAllGameSlugs, getGameAwards, getScoreSheetConfig } from '@/lib/supabase/queries'
import { getGameRelationsGrouped } from '@/lib/supabase/family-queries'
import { getGameReviews, getGameAggregateRating } from '@/lib/supabase/user-queries'
import { GameJsonLd, BreadcrumbJsonLd } from '@/lib/seo'
import type { ReferenceContent, GameRow } from '@/types/database'

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

// Transform database config to component-expected format
function transformScoreSheetConfig(config: Awaited<ReturnType<typeof getScoreSheetConfig>>) {
  if (!config) return null

  let customStyles: { instructions?: string[]; tiebreaker?: string | null } | null = null
  if (config.custom_styles) {
    if (typeof config.custom_styles === 'string') {
      try {
        customStyles = JSON.parse(config.custom_styles)
      } catch {
        customStyles = null
      }
    } else if (typeof config.custom_styles === 'object') {
      customStyles = config.custom_styles as { instructions?: string[]; tiebreaker?: string | null }
    }
  }

  return {
    ...config,
    custom_styles: customStyles,
  }
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params
  const game = await getGameWithDetails(slug)

  if (!game) {
    notFound()
  }

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Games', href: '/games' },
    { name: game.name, href: `/games/${game.slug}` },
  ]

  // Parallel data fetching for all tabs
  const [
    gameAwards,
    gameRelations,
    reviewsData,
    aggregateRating,
    rawScoreSheetConfig,
  ] = await Promise.all([
    getGameAwards(game.id),
    getGameRelationsGrouped(game.id),
    getGameReviews(game.id),
    getGameAggregateRating(game.id),
    game.has_score_sheet ? getScoreSheetConfig(game.id) : Promise.resolve(null),
  ])

  const scoreSheetConfig = transformScoreSheetConfig(rawScoreSheetConfig)

  // Build tabs array based on available content
  // Icons are passed as strings and resolved client-side in GamePageTabs
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'info',
      available: true,
      content: (
        <OverviewTab
          game={game}
          gameAwards={gameAwards}
          gameRelations={gameRelations}
          initialReviews={reviewsData.reviews}
          initialHasMore={reviewsData.hasMore}
        />
      ),
    },
    {
      id: 'rules',
      label: 'How to Play',
      icon: 'book-open',
      available: game.has_rules === true,
      content: (
        <RulesTab
          game={game}
          content={game.rules_content as Parameters<typeof RulesTab>[0]['content']}
          wikipediaGameplay={game.wikipedia_gameplay}
          wikipediaUrl={game.wikipedia_url}
          keyReminders={(game.reference_content as ReferenceContent | null)?.reminders || (game.reference_content as ReferenceContent | null)?.quickReminders}
        />
      ),
    },
    {
      id: 'setup',
      label: 'Setup',
      icon: 'boxes',
      available: game.has_setup_guide === true,
      content: (
        <SetupTab
          game={game}
          content={game.setup_content as Parameters<typeof SetupTab>[0]['content']}
        />
      ),
    },
    {
      id: 'score-sheet',
      label: 'Score Sheet',
      icon: 'file-text',
      available: game.has_score_sheet === true,
      content: (
        <ScoreSheetTab
          game={game as GameRow}
          scoreSheetConfig={scoreSheetConfig}
        />
      ),
    },
  ]

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

        {/* Hero Section */}
        <GameHero
          game={game}
          aggregateRating={aggregateRating}
          baseGame={gameRelations.baseGame}
        />

        {/* Tabbed Content */}
        <GamePageTabs tabs={tabs} defaultTab="overview" />
      </div>
    </>
  )
}
