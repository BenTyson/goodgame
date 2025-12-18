import { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Download, Users, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { mockGames } from '@/data/mock-games'

export const metadata: Metadata = {
  title: 'Score Sheets',
  description:
    'Free printable score sheets for popular board games. Generate custom PDF score cards with player names for Catan, Wingspan, 7 Wonders, and more.',
}

export default function ScoreSheetsPage() {
  const gamesWithScoreSheets = mockGames.filter((game) => game.has_score_sheet)

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Score Sheets
            </h1>
            <p className="text-muted-foreground">
              Free printable score sheets for {gamesWithScoreSheets.length} games
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-8 max-w-2xl">
        <p className="text-muted-foreground">
          Generate custom score sheets for your favorite board games. Enter
          player names, track scores during the game, and download or print a
          clean PDF. All score sheets are generated in your browser - no sign-up
          required.
        </p>
      </div>

      {/* Score sheets grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {gamesWithScoreSheets.map((game) => (
          <Link key={game.slug} href={`/games/${game.slug}/score-sheet`}>
            <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{game.name}</CardTitle>
                    {game.tagline && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {game.tagline}
                      </p>
                    )}
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {game.player_count_min}-{game.player_count_max} players
                    </span>
                  </div>
                  {game.play_time_min && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{game.play_time_min}-{game.play_time_max}m</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Download className="h-3 w-3" />
                    PDF
                  </Badge>
                  <Badge variant="outline">Printable</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <p className="text-muted-foreground mb-4">
          Don&apos;t see the game you&apos;re looking for?
        </p>
        <Button variant="outline" asChild>
          <Link href="/games">Browse All Games</Link>
        </Button>
      </div>
    </div>
  )
}
