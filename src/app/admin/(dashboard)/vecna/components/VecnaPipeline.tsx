'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VecnaFamilySidebar } from './VecnaFamilySidebar'
import { VecnaFamilyHeader } from './VecnaFamilyHeader'
import { VecnaGamePanel } from './VecnaGamePanel'
import { VecnaEmptyState } from './VecnaEmptyState'
import { SourcesDrawer } from './SourcesDrawer'
import type { VecnaFamily, VecnaGame, Phase } from '@/lib/vecna'
import { getPhaseForState, isBlockedState } from '@/lib/vecna'

interface VecnaPipelineProps {
  families: VecnaFamily[]
  standaloneGames: VecnaGame[]
}

export function VecnaPipeline({ families, standaloneGames }: VecnaPipelineProps) {
  const router = useRouter()

  // Auto-select first family on mount
  const initialFamily = families[0] || null
  const initialGame = initialFamily?.games[0] || standaloneGames[0] || null

  // Selected state
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(initialFamily?.id || null)
  const [selectedGameId, setSelectedGameId] = useState<string | null>(initialGame?.id || null)
  const [showStandalone, setShowStandalone] = useState(!initialFamily && standaloneGames.length > 0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Filter state - now phase-based
  const [stateFilter, setStateFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Sources drawer state
  const [sourcesDrawerOpen, setSourcesDrawerOpen] = useState(false)

  // Find selected family and game
  const selectedFamily = useMemo(() => {
    if (!selectedFamilyId) return null
    return families.find(f => f.id === selectedFamilyId) || null
  }, [families, selectedFamilyId])

  const selectedGame = useMemo(() => {
    if (!selectedGameId) return null

    if (showStandalone) {
      return standaloneGames.find(g => g.id === selectedGameId) || null
    }

    if (selectedFamily) {
      return selectedFamily.games.find(g => g.id === selectedGameId) || null
    }

    return null
  }, [selectedGameId, selectedFamily, standaloneGames, showStandalone])

  // Filter helper - check if game matches current filter
  const gameMatchesFilter = (game: VecnaGame): boolean => {
    if (stateFilter === 'all') return true
    if (stateFilter === 'blocked') return isBlockedState(game.vecna_state)
    // Phase-based filtering
    return getPhaseForState(game.vecna_state) === stateFilter
  }

  // Filtered families based on search and state filter
  const filteredFamilies = useMemo(() => {
    let result = families

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.games.some(g => g.name.toLowerCase().includes(q))
      )
    }

    // Phase/state filter
    if (stateFilter !== 'all') {
      result = result.filter(f =>
        f.games.some(g => gameMatchesFilter(g))
      )
    }

    return result
  }, [families, searchQuery, stateFilter])

  // Filtered standalone games
  const filteredStandaloneGames = useMemo(() => {
    let result = standaloneGames

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(g => g.name.toLowerCase().includes(q))
    }

    if (stateFilter !== 'all') {
      result = result.filter(g => gameMatchesFilter(g))
    }

    return result
  }, [standaloneGames, searchQuery, stateFilter])

  // Handle family selection
  const handleSelectFamily = (familyId: string) => {
    setShowStandalone(false)
    setSelectedFamilyId(familyId)
    // Auto-select first game in family
    const family = families.find(f => f.id === familyId)
    if (family && family.games.length > 0) {
      setSelectedGameId(family.games[0].id)
    } else {
      setSelectedGameId(null)
    }
  }

  // Handle game selection
  const handleSelectGame = (gameId: string) => {
    setSelectedGameId(gameId)
  }

  // Handle standalone selection
  const handleSelectStandalone = () => {
    setShowStandalone(true)
    setSelectedFamilyId(null)
    if (filteredStandaloneGames.length > 0) {
      setSelectedGameId(filteredStandaloneGames[0].id)
    } else {
      setSelectedGameId(null)
    }
  }

  // Handle processing complete
  const handleProcessingComplete = () => {
    router.refresh()
  }

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
    }
  }, [families, standaloneGames])

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <VecnaFamilySidebar
        families={filteredFamilies}
        standaloneGames={filteredStandaloneGames}
        selectedFamilyId={selectedFamilyId}
        selectedGameId={selectedGameId}
        showStandalone={showStandalone}
        stateFilter={stateFilter}
        searchQuery={searchQuery}
        stats={stats}
        collapsed={sidebarCollapsed}
        onSelectFamily={handleSelectFamily}
        onSelectGame={handleSelectGame}
        onSelectStandalone={handleSelectStandalone}
        onStateFilterChange={setStateFilter}
        onSearchChange={setSearchQuery}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background relative flex flex-col">
        {/* Expand button when collapsed */}
        {sidebarCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(false)}
            className="absolute left-2 top-2 z-10"
            title="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Family Header (only when family has multiple games - otherwise redundant) */}
        {selectedFamily && !showStandalone && selectedFamily.games.length > 1 && (
          <div className="flex-shrink-0 p-4 border-b">
            <VecnaFamilyHeader
              family={selectedFamily}
              onProcessingComplete={handleProcessingComplete}
            />
          </div>
        )}

        {/* Game Panel or Empty State */}
        <div className="flex-1 overflow-y-auto">
          {selectedGame ? (
            <VecnaGamePanel
              key={selectedGame.id}
              game={selectedGame}
              family={selectedFamily}
              isStandalone={showStandalone}
              onOpenSourcesDrawer={() => setSourcesDrawerOpen(true)}
            />
          ) : (
            <VecnaEmptyState
              stats={stats}
              hasSelection={!!selectedFamilyId || showStandalone}
            />
          )}
        </div>
      </main>

      {/* Sources Drawer */}
      <SourcesDrawer
        open={sourcesDrawerOpen}
        onOpenChange={setSourcesDrawerOpen}
        game={selectedGame}
      />
    </div>
  )
}
