import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScoreSheetGenerator } from '@/components/score-sheet'
import { getGameBySlug, getAllGameSlugs, getScoreSheetConfig } from '@/lib/supabase/queries'

// Transform database config to component-expected format
function transformScoreSheetConfig(config: Awaited<ReturnType<typeof getScoreSheetConfig>>) {
  if (!config) return null

  // Parse custom_styles if it's a string (JSON)
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

interface ScoreSheetPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: ScoreSheetPageProps): Promise<Metadata> {
  const { slug } = await params
  const game = await getGameBySlug(slug)

  if (!game) {
    return {
      title: 'Game Not Found',
    }
  }

  return {
    title: `${game.name} Score Sheet`,
    description: `Free printable score sheet for ${game.name}. Generate a custom PDF score card with player names and scoring categories.`,
  }
}

export async function generateStaticParams() {
  const slugs = await getAllGameSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function ScoreSheetPage({ params }: ScoreSheetPageProps) {
  const { slug } = await params
  const game = await getGameBySlug(slug)

  if (!game) {
    notFound()
  }

  if (!game.has_score_sheet) {
    notFound()
  }

  // Fetch score sheet config from database and transform to expected format
  const rawConfig = await getScoreSheetConfig(game.id)
  const scoreSheetConfig = transformScoreSheetConfig(rawConfig)

  return (
    <div className="container py-8 md:py-12">
      {/* Breadcrumb & Back */}
      <div className="mb-6 flex items-center justify-between">
        <nav className="text-sm text-muted-foreground">
          <Link href="/games" className="hover:text-foreground">
            Games
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/games/${game.slug}`} className="hover:text-foreground">
            {game.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Score Sheet</span>
        </nav>
        <Button variant="ghost" size="sm" asChild className="print:hidden">
          <Link href={`/games/${game.slug}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Game
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="mb-8 print:mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 print:hidden">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {game.name} Score Sheet
            </h1>
            <p className="text-muted-foreground print:hidden">
              Generate a custom score sheet for your game
            </p>
          </div>
        </div>
      </div>

      {/* Score Sheet Generator */}
      <ScoreSheetGenerator
        game={game}
        minPlayers={game.player_count_min || 2}
        maxPlayers={Math.min(game.player_count_max || 6, 6)}
        scoreSheetConfig={scoreSheetConfig}
      />
    </div>
  )
}
