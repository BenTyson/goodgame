'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Image as ImageIcon,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { VecnaGame } from '@/lib/vecna'
import { VECNA_STATE_CONFIG } from '@/lib/vecna'

interface ProcessingQueueProps {
  queue: VecnaGame[]
  completedGames: VecnaGame[]
  activeGameId: string | null
  onSelectGame: (game: VecnaGame) => void
  onRemoveFromQueue: (gameId: string) => void
  onClearCompleted: () => void
}

export function ProcessingQueue({
  queue,
  completedGames,
  activeGameId,
  onSelectGame,
  onRemoveFromQueue,
  onClearCompleted,
}: ProcessingQueueProps) {
  const [showCompleted, setShowCompleted] = useState(true)

  return (
    <div className="flex flex-col h-full bg-muted/30 border-r">
      {/* Header */}
      <div className="px-4 py-5 border-b">
        <h2 className="text-lg font-semibold">Queue</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {queue.length} pending
          {completedGames.length > 0 && ` / ${completedGames.length} done`}
        </p>
      </div>

      {/* Queue list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {/* Active + pending */}
          {queue.map((game, index) => {
            const isActive = game.id === activeGameId
            const isProcessing = game.vecna_state === 'parsing' || game.vecna_state === 'generating'

            return (
              <div
                key={game.id}
                onClick={() => onSelectGame(game)}
                className={cn(
                  'group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors',
                  isActive
                    ? 'bg-primary/10 border-2 border-primary/30'
                    : 'hover:bg-muted border-2 border-transparent',
                  isProcessing && 'animate-pulse'
                )}
              >
                {/* Drag handle */}
                <GripVertical className="h-5 w-5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0" />

                {/* Thumbnail */}
                <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {game.thumbnail_url ? (
                    <Image
                      src={game.thumbnail_url}
                      alt={game.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'font-medium truncate',
                    isActive && 'text-primary'
                  )}>
                    {game.name}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {VECNA_STATE_CONFIG[game.vecna_state].label}
                  </p>
                </div>

                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveFromQueue(game.id)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )
          })}

          {/* Empty queue state */}
          {queue.length === 0 && completedGames.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No games in queue
            </div>
          )}

          {/* Completed section */}
          {completedGames.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 w-full px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {showCompleted ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span>Completed</span>
                <Badge variant="secondary" className="ml-auto">
                  {completedGames.length}
                </Badge>
              </button>

              {showCompleted && (
                <div className="mt-2 space-y-2">
                  {completedGames.map(game => (
                    <div
                      key={game.id}
                      onClick={() => onSelectGame(game)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-muted',
                        game.id === activeGameId && 'bg-muted'
                      )}
                    >
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />

                      {/* Thumbnail */}
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {game.thumbnail_url ? (
                          <Image
                            src={game.thumbnail_url}
                            alt={game.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>

                      <p className="truncate flex-1">{game.name}</p>
                    </div>
                  ))}

                  {/* Clear completed */}
                  <Button
                    variant="ghost"
                    size="default"
                    className="w-full mt-3 text-muted-foreground"
                    onClick={onClearCompleted}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear completed
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
