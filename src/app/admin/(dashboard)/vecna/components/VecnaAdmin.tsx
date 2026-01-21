'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Compass, Cog, ChartBar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VecnaFamily, VecnaGame, VecnaState } from '@/lib/vecna'
import { getPhaseForState, isBlockedState } from '@/lib/vecna'
import { DiscoveryTab } from './discovery/DiscoveryTab'
import { ProcessingTab } from './processing/ProcessingTab'

interface RequestedGame {
  game: VecnaGame
  requestCount: number
}

interface VecnaAdminProps {
  families: VecnaFamily[]
  standaloneGames: VecnaGame[]
  mostRequestedGames?: RequestedGame[]
}

type Tab = 'discovery' | 'processing'

export function VecnaAdmin({ families, standaloneGames, mostRequestedGames = [] }: VecnaAdminProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('discovery')

  // Processing queue state - persists when switching tabs
  const [processingQueue, setProcessingQueue] = useState<VecnaGame[]>([])
  const [completedGames, setCompletedGames] = useState<VecnaGame[]>([])

  // Calculate aggregate stats
  const stats = useMemo(() => {
    const allGames = [
      ...families.flatMap(f => f.games),
      ...standaloneGames,
    ]

    return {
      total: allGames.length,
      published: allGames.filter(g => g.is_published).length,
      needsReview: allGames.filter(g =>
        g.vecna_state === 'generated' || g.vecna_state === 'review_pending'
      ).length,
      missingRulebook: allGames.filter(g =>
        !g.has_rulebook && !g.is_published
      ).length,
      processing: allGames.filter(g =>
        g.vecna_state === 'parsing' || g.vecna_state === 'generating'
      ).length,
      inQueue: processingQueue.length,
    }
  }, [families, standaloneGames, processingQueue])

  // Add games to processing queue and switch to processing tab
  const handleStartProcessing = useCallback((games: VecnaGame[]) => {
    setProcessingQueue(prev => {
      // Avoid duplicates
      const existingIds = new Set(prev.map(g => g.id))
      const newGames = games.filter(g => !existingIds.has(g.id))
      return [...prev, ...newGames]
    })
    setActiveTab('processing')
  }, [])

  // Remove game from queue
  const handleRemoveFromQueue = useCallback((gameId: string) => {
    setProcessingQueue(prev => prev.filter(g => g.id !== gameId))
  }, [])

  // Mark game as completed
  const handleGameCompleted = useCallback((game: VecnaGame) => {
    setProcessingQueue(prev => prev.filter(g => g.id !== game.id))
    setCompletedGames(prev => [game, ...prev])
    router.refresh()
  }, [router])

  // Clear completed games
  const handleClearCompleted = useCallback(() => {
    setCompletedGames([])
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header with tabs and stats */}
      <div className="flex-shrink-0 border-b bg-background">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Vecna Pipeline</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <ChartBar className="h-4 w-4" />
                <span>{stats.total} games</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <span>{stats.published} published</span>
              {stats.needsReview > 0 && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <span className="text-amber-600">{stats.needsReview} need review</span>
                </>
              )}
              {processingQueue.length > 0 && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <span className="text-primary">{processingQueue.length} in queue</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="px-6 flex gap-1">
          <button
            onClick={() => setActiveTab('discovery')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px',
              activeTab === 'discovery'
                ? 'bg-primary/5 text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/50'
            )}
          >
            <Compass className="h-4 w-4" />
            Discovery
          </button>
          <button
            onClick={() => setActiveTab('processing')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px',
              activeTab === 'processing'
                ? 'bg-primary/5 text-primary border-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/50',
              processingQueue.length > 0 && activeTab !== 'processing' && 'text-primary'
            )}
          >
            <Cog className="h-4 w-4" />
            Processing
            {processingQueue.length > 0 && (
              <span className={cn(
                'ml-1 px-1.5 py-0.5 text-xs rounded-full',
                activeTab === 'processing'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-primary text-primary-foreground'
              )}>
                {processingQueue.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'discovery' ? (
          <DiscoveryTab
            families={families}
            standaloneGames={standaloneGames}
            mostRequestedGames={mostRequestedGames}
            onStartProcessing={handleStartProcessing}
          />
        ) : (
          <ProcessingTab
            queue={processingQueue}
            completedGames={completedGames}
            families={families}
            onRemoveFromQueue={handleRemoveFromQueue}
            onGameCompleted={handleGameCompleted}
            onClearCompleted={handleClearCompleted}
            onGoToDiscovery={() => setActiveTab('discovery')}
          />
        )}
      </div>
    </div>
  )
}
