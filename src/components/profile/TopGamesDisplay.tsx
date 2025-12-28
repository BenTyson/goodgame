'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trophy, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

  // Empty state for owner
  if (games.length === 0 && isOwner) {
    return (
      <>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            Top Games
          </h2>
          <div className="py-8 text-center rounded-xl border border-dashed">
            <Trophy className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Showcase your all-time favorites
            </p>
            <Button onClick={() => setIsEditorOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Games
            </Button>
          </div>
        </div>

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
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            Top {games.length} Games
          </h2>
          {isOwner && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditorOpen(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </div>

        {/* Horizontal strip of games */}
        <div className="flex gap-3 overflow-x-auto py-1 px-1 -mx-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {games.map((item) => (
            <GameCard key={item.id} game={item} />
          ))}
        </div>
      </div>

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

interface GameCardProps {
  game: TopGameWithDetails
}

function GameCard({ game }: GameCardProps) {
  // Medal colors for top 3 with subtle glow
  const medalStyles: Record<number, string> = {
    1: 'ring-2 ring-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]', // Gold
    2: 'ring-2 ring-gray-300 shadow-[0_0_8px_rgba(209,213,219,0.4)]',   // Silver
    3: 'ring-2 ring-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.4)]',    // Bronze
  }
  const medalStyle = medalStyles[game.position] || ''

  return (
    <Link
      href={`/games/${game.game.slug}`}
      className="group flex-shrink-0 w-20 sm:w-24"
    >
      {/* Game image - outer wrapper for ring visibility */}
      <div className={`relative aspect-square rounded-lg ${medalStyle}`}>
        <div className="absolute inset-0 rounded-lg overflow-hidden bg-muted">
          {game.game.box_image_url || game.game.thumbnail_url ? (
            <Image
              src={game.game.box_image_url || game.game.thumbnail_url || ''}
              alt={game.game.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="96px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <span className="text-xl font-bold text-primary/40">
                {game.game.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Position + Game name */}
      <p className="mt-1.5 text-xs text-center truncate text-muted-foreground group-hover:text-foreground transition-colors">
        <span className="text-muted-foreground/60 mr-0.5">{game.position}.</span>
        <span className="font-medium">{game.game.name}</span>
      </p>
    </Link>
  )
}
