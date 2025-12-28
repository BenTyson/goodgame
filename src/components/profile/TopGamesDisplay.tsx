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
        <div className="rounded-xl bg-card/50 p-6">
          <div className="text-center py-4">
            <Trophy className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">Add Your Top Games</h3>
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
      <div className="rounded-xl bg-card/50 p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Top {games.length} Games
          </h3>
          {isOwner && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditorOpen(true)} className="h-7 px-2">
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
        </div>

        {/* Horizontal strip of games */}
        <div className="flex gap-3 overflow-x-auto pt-2 pb-2 pl-2 -mt-2 -mb-2 -ml-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
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
  return (
    <Link
      href={`/games/${game.game.slug}`}
      className="group flex-shrink-0 w-20 sm:w-24"
    >
      <div className="relative">
        {/* Position badge - uses primary color */}
        <div className="absolute -top-1.5 -left-1.5 z-10 h-5 w-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shadow-sm">
          {game.position}
        </div>

        {/* Game image - uniform size */}
        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted shadow-sm group-hover:shadow-md transition-shadow">
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

      {/* Game name */}
      <p className="mt-1.5 text-xs font-medium text-center truncate group-hover:text-primary transition-colors">
        {game.game.name}
      </p>
    </Link>
  )
}
