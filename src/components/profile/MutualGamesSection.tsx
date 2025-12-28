'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { MutualGame } from '@/lib/supabase/user-queries'

interface MutualGamesSectionProps {
  mutualGames: MutualGame[]
  displayName: string
}

export function MutualGamesSection({ mutualGames, displayName }: MutualGamesSectionProps) {
  // Don't render if no mutual games
  if (mutualGames.length === 0) {
    return null
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Games You Both Have</h3>
        <Badge variant="secondary">{mutualGames.length}</Badge>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {mutualGames.slice(0, 12).map((game) => (
          <Link
            key={game.id}
            href={`/games/${game.slug}`}
            className="flex-shrink-0 w-16 group"
          >
            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              {game.box_image_url ? (
                <Image
                  src={game.box_image_url}
                  alt={game.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="64px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                  <span className="text-lg font-bold text-primary/40">
                    {game.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-center truncate text-muted-foreground group-hover:text-primary transition-colors">
              {game.name}
            </p>
          </Link>
        ))}
      </div>

      {mutualGames.length > 12 && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          +{mutualGames.length - 12} more games in common
        </p>
      )}
    </Card>
  )
}
