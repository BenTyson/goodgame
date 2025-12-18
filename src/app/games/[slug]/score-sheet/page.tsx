import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScoreSheetGenerator } from '@/components/score-sheet'
import { mockGames } from '@/data/mock-games'

interface ScoreSheetPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: ScoreSheetPageProps): Promise<Metadata> {
  const { slug } = await params
  const game = mockGames.find((g) => g.slug === slug)

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
  return mockGames
    .filter((game) => game.has_score_sheet)
    .map((game) => ({
      slug: game.slug,
    }))
}

export default async function ScoreSheetPage({ params }: ScoreSheetPageProps) {
  const { slug } = await params
  const game = mockGames.find((g) => g.slug === slug)

  if (!game) {
    notFound()
  }

  if (!game.has_score_sheet) {
    notFound()
  }

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
        minPlayers={game.player_count_min}
        maxPlayers={Math.min(game.player_count_max, 6)}
      />
    </div>
  )
}
