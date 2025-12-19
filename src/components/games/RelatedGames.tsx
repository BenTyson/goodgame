'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Users, Clock } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { GameWithCategories } from '@/data/mock-games'

interface RelatedGamesProps {
  games: GameWithCategories[]
  title?: string
}

export function RelatedGames({ games, title = 'You Might Also Like' }: RelatedGamesProps) {
  if (games.length === 0) {
    return null
  }

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight mb-6">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {games.map((game) => (
          <Link key={game.slug} href={`/games/${game.slug}`} className="group">
            <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5">
              {/* Game image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                {game.box_image_url ? (
                  <Image
                    src={game.box_image_url}
                    alt={game.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <span className="text-4xl font-bold text-primary/40">
                      {game.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                {/* Categories */}
                {game.categories && game.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {game.categories.slice(0, 2).map((category) => (
                      <Badge
                        key={category.slug}
                        variant="secondary"
                        className="text-xs"
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                  {game.name}
                </h3>

                {/* Quick info */}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>
                      {game.player_count_min === game.player_count_max
                        ? game.player_count_min
                        : `${game.player_count_min}-${game.player_count_max}`}
                    </span>
                  </div>
                  {game.play_time_min && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {game.play_time_min === game.play_time_max
                          ? `${game.play_time_min}m`
                          : `${game.play_time_min}-${game.play_time_max}m`}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
