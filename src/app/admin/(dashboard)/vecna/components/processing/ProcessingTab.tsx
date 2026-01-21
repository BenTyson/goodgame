'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Inbox, ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { VecnaFamily, VecnaGame } from '@/lib/vecna'
import { ProcessingQueue } from './ProcessingQueue'
import { ProcessingPanel } from './ProcessingPanel'

interface ProcessingTabProps {
  queue: VecnaGame[]
  completedGames: VecnaGame[]
  families: VecnaFamily[]
  onRemoveFromQueue: (gameId: string) => void
  onGameCompleted: (game: VecnaGame) => void
  onClearCompleted: () => void
  onGoToDiscovery: () => void
}

export function ProcessingTab({
  queue,
  completedGames,
  families,
  onRemoveFromQueue,
  onGameCompleted,
  onClearCompleted,
  onGoToDiscovery,
}: ProcessingTabProps) {
  // Active game is the first in queue, or most recently viewed completed game
  const [activeGameId, setActiveGameId] = useState<string | null>(null)

  // Auto-select first game in queue if none selected
  useEffect(() => {
    if (!activeGameId && queue.length > 0) {
      setActiveGameId(queue[0].id)
    } else if (activeGameId && !queue.find(g => g.id === activeGameId) && !completedGames.find(g => g.id === activeGameId)) {
      // If current game was removed, select next in queue
      if (queue.length > 0) {
        setActiveGameId(queue[0].id)
      } else {
        setActiveGameId(null)
      }
    }
  }, [queue, completedGames, activeGameId])

  // Find active game from queue or completed
  const activeGame = useMemo(() => {
    if (!activeGameId) return null
    return queue.find(g => g.id === activeGameId) || completedGames.find(g => g.id === activeGameId) || null
  }, [activeGameId, queue, completedGames])

  // Find family for active game
  const activeGameFamily = useMemo(() => {
    if (!activeGame) return null
    return families.find(f => f.games.some(g => g.id === activeGame.id)) || null
  }, [activeGame, families])

  // Handle game selection from queue
  const handleSelectGame = useCallback((game: VecnaGame) => {
    setActiveGameId(game.id)
  }, [])

  // Handle moving to next game
  const handleNextGame = useCallback(() => {
    const currentIndex = queue.findIndex(g => g.id === activeGameId)
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      setActiveGameId(queue[currentIndex + 1].id)
    } else if (queue.length > 0) {
      setActiveGameId(queue[0].id)
    }
  }, [queue, activeGameId])

  // Empty state
  if (queue.length === 0 && completedGames.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No games in processing queue</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Select games in the Discovery tab to add them to your processing queue
        </p>
        <Button onClick={onGoToDiscovery} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Go to Discovery
        </Button>
      </div>
    )
  }

  // All complete state
  if (queue.length === 0 && completedGames.length > 0) {
    return (
      <div className="flex h-full">
        {/* Queue sidebar */}
        <div className="w-80 flex-shrink-0">
          <ProcessingQueue
            queue={queue}
            completedGames={completedGames}
            activeGameId={activeGameId}
            onSelectGame={handleSelectGame}
            onRemoveFromQueue={onRemoveFromQueue}
            onClearCompleted={onClearCompleted}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">All games complete!</h2>
          <p className="text-muted-foreground mb-6">
            {completedGames.length} game{completedGames.length !== 1 ? 's' : ''} processed this session
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClearCompleted}>
              Clear completed
            </Button>
            <Button onClick={onGoToDiscovery} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Start new batch
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Queue sidebar */}
      <div className="w-80 flex-shrink-0">
        <ProcessingQueue
          queue={queue}
          completedGames={completedGames}
          activeGameId={activeGameId}
          onSelectGame={handleSelectGame}
          onRemoveFromQueue={onRemoveFromQueue}
          onClearCompleted={onClearCompleted}
        />
      </div>

      {/* Processing panel */}
      <div className="flex-1 overflow-y-auto">
        {activeGame ? (
          <ProcessingPanel
            key={activeGame.id}
            game={activeGame}
            family={activeGameFamily}
            onGameCompleted={onGameCompleted}
            onNextGame={queue.length > 1 || (queue.length === 1 && queue[0].id !== activeGameId) ? handleNextGame : undefined}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <p className="text-muted-foreground">
              Select a game from the queue to start processing
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
