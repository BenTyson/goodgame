'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ImageIcon, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AutoLinkRelations } from '../AutoLinkRelations'
import type { Game } from '@/types/database'

interface UnlinkedGamesCardProps {
  orphans: Game[]
  familyId?: string
  games: Game[]
  onLinkGame: (game: Game) => void
  onRelationsCreated?: () => void
}

export function UnlinkedGamesCard({
  orphans,
  familyId,
  games,
  onLinkGame,
  onRelationsCreated,
}: UnlinkedGamesCardProps) {
  if (orphans.length === 0) {
    return null
  }

  return (
    <Card className="border-dashed border-amber-500/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Unlinked Games ({orphans.length})
          </CardTitle>
          {familyId && (
            <AutoLinkRelations
              familyId={familyId}
              unlinkedCount={orphans.length}
              hasWikipediaUrl={games.some(g => g.wikipedia_url)}
              onRelationsCreated={onRelationsCreated}
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          These games are in the family but have no defined relations. Click &quot;Link&quot; to connect them.
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {orphans.map(game => {
          const thumbnail = game.thumbnail_url ||
            (game.bgg_raw_data as { thumbnail?: string } | null)?.thumbnail

          return (
            <div
              key={game.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group"
            >
              <div className="shrink-0 h-8 w-8 rounded overflow-hidden bg-muted">
                {thumbnail ? (
                  <Image
                    src={thumbnail}
                    alt={game.name}
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-3 w-3 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <Link
                href={`/admin/games/${game.id}`}
                className="font-medium text-sm hover:text-primary transition-colors flex-1 truncate"
              >
                {game.name}
              </Link>
              {game.year_published && (
                <span className="text-xs text-muted-foreground">
                  {game.year_published}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLinkGame(game)}
                className="shrink-0 h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Link2 className="h-3 w-3 mr-1" />
                Link
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
