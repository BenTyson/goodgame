'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TopGamesEditor } from './TopGamesEditor'
import type { TopGameWithDetails } from '@/lib/supabase/user-queries'

interface TopGamesDisplayProps {
  topGames: TopGameWithDetails[]
  isOwner: boolean
  userId: string
  onUpdate?: (games: TopGameWithDetails[]) => void
}

export function TopGamesDisplay({ topGames, isOwner, userId, onUpdate }: TopGamesDisplayProps) {
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [games, setGames] = useState(topGames)

  const handleSave = (updatedGames: TopGameWithDetails[]) => {
    setGames(updatedGames)
    onUpdate?.(updatedGames)
  }

  // Split into podium (top 3) and rest
  const podiumGames = games.slice(0, 3)
  const restGames = games.slice(3)

  // Empty state for owner
  if (games.length === 0 && isOwner) {
    return (
      <>
        <Card className="mb-8">
          <CardContent className="py-8 text-center">
            <Trophy className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">Add Your Top 10 Games</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Showcase your all-time favorite board games
            </p>
            <Button onClick={() => setIsEditorOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Top Games
            </Button>
          </CardContent>
        </Card>

        <TopGamesEditor
          open={isEditorOpen}
          onOpenChange={setIsEditorOpen}
          userId={userId}
          initialGames={games}
          onSave={handleSave}
        />
      </>
    )
  }

  // Empty state for visitors
  if (games.length === 0) {
    return null
  }

  return (
    <>
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Top {games.length} Games
            </CardTitle>
            {isOwner && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditorOpen(true)}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Podium - Top 3 */}
          {podiumGames.length > 0 && (
            <div className="flex justify-center gap-4 mb-6">
              {/* Second place */}
              {podiumGames[1] && (
                <div className="flex flex-col items-center mt-4">
                  <PodiumCard game={podiumGames[1]} position={2} />
                </div>
              )}
              {/* First place */}
              {podiumGames[0] && (
                <div className="flex flex-col items-center">
                  <PodiumCard game={podiumGames[0]} position={1} featured />
                </div>
              )}
              {/* Third place */}
              {podiumGames[2] && (
                <div className="flex flex-col items-center mt-6">
                  <PodiumCard game={podiumGames[2]} position={3} />
                </div>
              )}
            </div>
          )}

          {/* Rest of the games (4-10) */}
          {restGames.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {restGames.map((item) => (
                <Link
                  key={item.id}
                  href={`/games/${item.game.slug}`}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    #{item.position}
                  </span>
                  <div className="relative h-6 w-6 rounded overflow-hidden bg-muted-foreground/20">
                    {item.game.box_image_url || item.game.thumbnail_url ? (
                      <Image
                        src={item.game.box_image_url || item.game.thumbnail_url || ''}
                        alt={item.game.name}
                        fill
                        className="object-cover"
                        sizes="24px"
                      />
                    ) : (
                      <span className="flex items-center justify-center h-full text-xs font-bold text-muted-foreground">
                        {item.game.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {item.game.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TopGamesEditor
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        userId={userId}
        initialGames={games}
        onSave={handleSave}
      />
    </>
  )
}

interface PodiumCardProps {
  game: TopGameWithDetails
  position: number
  featured?: boolean
}

function PodiumCard({ game, position, featured }: PodiumCardProps) {
  const size = featured ? 'h-28 w-28' : 'h-20 w-20'
  const medalColors = {
    1: 'bg-amber-400 text-amber-900',
    2: 'bg-gray-300 text-gray-700',
    3: 'bg-amber-700 text-amber-100',
  }

  return (
    <Link href={`/games/${game.game.slug}`} className="group text-center">
      <div className="relative">
        {/* Position badge */}
        <div
          className={`absolute -top-2 -left-2 z-10 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shadow ${medalColors[position as keyof typeof medalColors]}`}
        >
          {position}
        </div>

        {/* Game image */}
        <div className={`relative ${size} rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-shadow`}>
          {game.game.box_image_url || game.game.thumbnail_url ? (
            <Image
              src={game.game.box_image_url || game.game.thumbnail_url || ''}
              alt={game.game.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes={featured ? '112px' : '80px'}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className={`font-bold text-primary/40 ${featured ? 'text-3xl' : 'text-xl'}`}>
                {game.game.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Game name */}
      <p className={`mt-2 font-medium text-center truncate max-w-24 group-hover:text-primary transition-colors ${featured ? 'text-sm' : 'text-xs'}`}>
        {game.game.name}
      </p>
    </Link>
  )
}
