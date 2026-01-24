import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  AdminPreviewBanner,
  GameHero,
  GamePageTabs,
  OverviewTab,
  RulesTab,
  SetupTab,
  ScoreSheetTab,
  PromosTab,
  FamilyTreeTab,
} from '@/components/games'
import { VibesTab } from '@/components/vibes'
import { getGameWithDetails, getGameWithDetailsForAdmin, getAllGameSlugs, getGameAwards, getScoreSheetConfig, getGameDocuments } from '@/lib/supabase/queries'
import { isAdmin } from '@/lib/supabase/admin'
import { getGameRelationsGrouped, getGamePromos, getGameFamilyTreeData } from '@/lib/supabase/family-queries'
import { getGameReviews, getGameAggregateRating } from '@/lib/supabase/user-queries'
import { getGameVibeStats, getGameVibes } from '@/lib/supabase/vibe-queries'
import { GameJsonLd, BreadcrumbJsonLd } from '@/lib/seo'
import type { ReferenceContent, GameRow } from '@/types/database'

interface GamePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { slug } = await params
  const userIsAdmin = await isAdmin()

  let game = await getGameWithDetails(slug)

  // If no published game found and user is admin, try admin query
  if (!game && userIsAdmin) {
    game = await getGameWithDetailsForAdmin(slug)
  }

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
    // Prevent indexing of unpublished games
    ...(game.is_published === false && {
      robots: 'noindex, nofollow'
    })
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
  const userIsAdmin = await isAdmin()

  let game = await getGameWithDetails(slug)
  let isAdminPreview = false

  // If no published game found and user is admin, try admin query
  if (!game && userIsAdmin) {
    game = await getGameWithDetailsForAdmin(slug)
    if (game) {
      isAdminPreview = true
    }
  }

  if (!game) {
    notFound()
  }

  const breadcrumbs = [
    { name: 'Home', href: '/' },
    { name: 'Games', href: '/games' },
    { name: game.name, href: `/games/${game.slug}` },
  ]

  // Parallel data fetching for all tabs
  let gameAwards, gameRelations, gameDocuments, reviewsData, aggregateRating,
      rawScoreSheetConfig, vibeStats, vibesData, gamePromos, familyTreeData

  try {
    [
      gameAwards,
      gameRelations,
      gameDocuments,
      reviewsData,
      aggregateRating,
      rawScoreSheetConfig,
      vibeStats,
      vibesData,
      gamePromos,
      familyTreeData,
    ] = await Promise.all([
      getGameAwards(game.id),
      getGameRelationsGrouped(game.id),
      getGameDocuments(game.id),
      getGameReviews(game.id),
      getGameAggregateRating(game.id),
      game.has_score_sheet ? getScoreSheetConfig(game.id) : Promise.resolve(null),
      getGameVibeStats(game.id),
      getGameVibes(game.id),
      getGamePromos(game.id),
      getGameFamilyTreeData(game.id),
    ])
  } catch (error) {
    console.error('Game page data fetch error for:', game.slug, error)
    throw error
  }

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
          gameDocuments={gameDocuments}
          initialReviews={reviewsData.reviews}
          initialHasMore={reviewsData.hasMore}
          reviewVideos={game.review_videos}
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
          gameplayVideos={game.gameplay_videos}
          gameDocuments={gameDocuments}
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
          gameDocuments={gameDocuments}
        />
      ),
    },
    {
      id: 'vibes',
      label: 'Vibes',
      icon: 'sparkles',
      available: true,
      content: (
        <VibesTab
          gameId={game.id}
          gameName={game.name}
          initialStats={vibeStats}
          initialVibes={vibesData.vibes}
          initialHasMore={vibesData.hasMore}
        />
      ),
    },
    {
      id: 'family-tree',
      label: familyTreeData ? `Family Tree (${familyTreeData.games.length})` : 'Family Tree',
      icon: 'git-branch',
      available: familyTreeData !== null,
      content: familyTreeData ? (
        <FamilyTreeTab
          currentGameId={game.id}
          family={familyTreeData.family}
          games={familyTreeData.games}
          relations={familyTreeData.relations}
          baseGameId={familyTreeData.baseGameId}
        />
      ) : null,
    },
    {
      id: 'promos',
      label: gamePromos.length > 0 ? `Promos & Extras (${gamePromos.length})` : 'Promos & Extras',
      icon: 'gift',
      available: gamePromos.length > 0,
      content: (
        <PromosTab
          gameName={game.name}
          promos={gamePromos}
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
      {/* Admin Preview Banner - only shown for unpublished games */}
      {isAdminPreview && (
        <AdminPreviewBanner gameId={game.id} gameName={game.name} />
      )}

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
          awards={gameAwards}
        />

        {/* Tabbed Content */}
        <GamePageTabs tabs={tabs} defaultTab="overview" />
      </div>
    </>
  )
}
