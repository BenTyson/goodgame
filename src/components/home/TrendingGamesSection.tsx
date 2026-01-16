'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, TrendingUp, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { TrendingGame } from '@/lib/supabase/game-queries'

interface TrendingGamesSectionProps {
  games: TrendingGame[]
}

export function TrendingGamesSection({ games }: TrendingGamesSectionProps) {
  if (games.length === 0) return null

  return (
    <section className="container py-16 md:py-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Trending This Week
            </h2>
          </div>
          <p className="text-muted-foreground text-lg">
            Games getting the most vibes right now
          </p>
        </div>
        <Button variant="outline" asChild className="hidden sm:flex group">
          <Link href="/games">
            View All
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {games.map((game) => (
          <TrendingGameCard key={game.id} game={game} />
        ))}
      </div>

      <div className="mt-8 text-center sm:hidden">
        <Button variant="outline" asChild>
          <Link href="/games">
            View All Games
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}

function TrendingGameCard({ game }: { game: TrendingGame }) {
  return (
    <Link href={`/games/${game.slug}`} className="group">
      <Card className="overflow-hidden transition-all duration-300 [box-shadow:var(--shadow-card)] hover:[box-shadow:var(--shadow-card-hover)] hover:-translate-y-1.5 hover:border-primary/30">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {game.box_image_url ? (
            <Image
              src={game.box_image_url}
              alt={game.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10">
              <span className="text-4xl font-bold text-primary/30">
                {game.name.charAt(0)}
              </span>
            </div>
          )}

          {/* Vibe badge overlay */}
          {game.averageVibe && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-medium">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {game.averageVibe.toFixed(1)}
            </div>
          )}
        </div>

        <CardContent className="p-3">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {game.name}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {game.recentVibeCount} {game.recentVibeCount === 1 ? 'vibe' : 'vibes'} this week
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
