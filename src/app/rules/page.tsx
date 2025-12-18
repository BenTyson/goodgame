import { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen, Users, Clock, Brain } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { mockGames } from '@/data/mock-games'

export const metadata: Metadata = {
  title: 'Rules Summaries',
  description:
    'Quick rules summaries and how-to-play guides for popular board games. Learn Catan, Wingspan, Ticket to Ride, and more in minutes.',
}

export default function RulesPage() {
  const gamesWithRules = mockGames.filter((game) => game.has_rules)

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Rules Summaries
            </h1>
            <p className="text-muted-foreground">
              Quick how-to-play guides for {gamesWithRules.length} games
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-8 max-w-2xl">
        <p className="text-muted-foreground">
          Learn how to play your favorite board games with our condensed rules
          summaries. Each guide covers setup, turn structure, scoring, and
          strategy tips - everything you need to start playing in minutes, not
          hours.
        </p>
      </div>

      {/* Rules grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {gamesWithRules.map((game) => (
          <Link key={game.slug} href={`/games/${game.slug}/rules`}>
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
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {game.player_count_min}-{game.player_count_max}
                    </span>
                  </div>
                  {game.play_time_min && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{game.play_time_min}-{game.play_time_max}m</span>
                    </div>
                  )}
                  {game.weight && (
                    <div className="flex items-center gap-1">
                      <Brain className="h-4 w-4" />
                      <span>{game.weight.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {game.categories?.slice(0, 2).map((cat) => (
                    <Badge key={cat.slug} variant="secondary" className="text-xs">
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <p className="text-muted-foreground mb-4">
          Looking for a specific game?
        </p>
        <Button variant="outline" asChild>
          <Link href="/games">Browse All Games</Link>
        </Button>
      </div>
    </div>
  )
}
