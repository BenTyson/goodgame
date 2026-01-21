'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, Layers, Box } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { VecnaFamily, VecnaGame } from '@/lib/vecna'
import { getPhaseForState } from '@/lib/vecna'
import { DiscoveryFilters } from './DiscoveryFilters'
import { GameDiscoveryCard } from './GameDiscoveryCard'
import { FamilySection } from './FamilySection'
import { BatchActionBar } from './BatchActionBar'

interface RequestedGame {
  game: VecnaGame
  requestCount: number
}

interface DiscoveryTabProps {
  families: VecnaFamily[]
  standaloneGames: VecnaGame[]
  mostRequestedGames: RequestedGame[]
  onStartProcessing: (games: VecnaGame[]) => void
}

export function DiscoveryTab({
  families,
  standaloneGames,
  mostRequestedGames,
  onStartProcessing,
}: DiscoveryTabProps) {
  const router = useRouter()

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('all')
  const [rulebookFilter, setRulebookFilter] = useState('all')
  const [familyFilter, setFamilyFilter] = useState('all')
  const [sortBy, setSortBy] = useState('priority')

  // Selection state
  const [selectedGameIds, setSelectedGameIds] = useState<Set<string>>(new Set())

  // Game filter function
  const gameMatchesFilters = useCallback((game: VecnaGame): boolean => {
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!game.name.toLowerCase().includes(q)) return false
    }

    // State filter
    if (stateFilter !== 'all' && game.vecna_state !== stateFilter) {
      return false
    }

    // Rulebook filter
    if (rulebookFilter === 'has_rulebook' && !game.has_rulebook) return false
    if (rulebookFilter === 'no_rulebook' && game.has_rulebook) return false
    if (rulebookFilter === 'ready_to_process') {
      if (!game.has_rulebook || game.is_published) return false
      if (['generated', 'review_pending', 'published'].includes(game.vecna_state)) return false
    }

    return true
  }, [searchQuery, stateFilter, rulebookFilter])

  // Filtered families
  const filteredFamilies = useMemo(() => {
    if (familyFilter === 'standalone') return []

    return families.filter(family => {
      // Check if family has any games matching filters
      const hasMatchingGames = family.games.some(gameMatchesFilters)
      if (!hasMatchingGames) return false

      // Search also matches family name
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (family.name.toLowerCase().includes(q)) return true
      }

      return true
    })
  }, [families, familyFilter, gameMatchesFilters, searchQuery])

  // Filtered standalone games
  const filteredStandaloneGames = useMemo(() => {
    if (familyFilter === 'has_family') return []
    return standaloneGames.filter(gameMatchesFilters)
  }, [standaloneGames, familyFilter, gameMatchesFilters])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchQuery) count++
    if (stateFilter !== 'all') count++
    if (rulebookFilter !== 'all') count++
    if (familyFilter !== 'all') count++
    if (sortBy !== 'priority') count++
    return count
  }, [searchQuery, stateFilter, rulebookFilter, familyFilter, sortBy])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setStateFilter('all')
    setRulebookFilter('all')
    setFamilyFilter('all')
    setSortBy('priority')
  }, [])

  // Selection handlers
  const handleSelectGame = useCallback((gameId: string, selected: boolean) => {
    setSelectedGameIds(prev => {
      const next = new Set(prev)
      if (selected) {
        next.add(gameId)
      } else {
        next.delete(gameId)
      }
      return next
    })
  }, [])

  const handleSelectAllInFamily = useCallback((familyId: string, selected: boolean) => {
    const family = families.find(f => f.id === familyId)
    if (!family) return

    setSelectedGameIds(prev => {
      const next = new Set(prev)
      const visibleGames = family.games.filter(gameMatchesFilters)
      visibleGames.forEach(game => {
        if (selected) {
          next.add(game.id)
        } else {
          next.delete(game.id)
        }
      })
      return next
    })
  }, [families, gameMatchesFilters])

  const handleClearSelection = useCallback(() => {
    setSelectedGameIds(new Set())
  }, [])

  // Get selected games
  const selectedGames = useMemo(() => {
    const allGames = [
      ...families.flatMap(f => f.games),
      ...standaloneGames,
    ]
    return allGames.filter(g => selectedGameIds.has(g.id))
  }, [families, standaloneGames, selectedGameIds])

  // Handle start processing
  const handleStartProcessing = useCallback(() => {
    onStartProcessing(selectedGames)
    setSelectedGameIds(new Set())
  }, [selectedGames, onStartProcessing])

  // Handle rulebook set - refresh data
  const handleRulebookSet = useCallback(() => {
    router.refresh()
  }, [router])

  // Request count map for quick lookup
  const requestCountMap = useMemo(() => {
    const map = new Map<string, number>()
    mostRequestedGames.forEach(r => map.set(r.game.id, r.requestCount))
    return map
  }, [mostRequestedGames])

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <DiscoveryFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        stateFilter={stateFilter}
        onStateFilterChange={setStateFilter}
        rulebookFilter={rulebookFilter}
        onRulebookFilterChange={setRulebookFilter}
        familyFilter={familyFilter}
        onFamilyFilterChange={setFamilyFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Most Requested Section */}
        {mostRequestedGames.length > 0 && !searchQuery && stateFilter === 'all' && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <h2 className="font-semibold">Most Requested</h2>
              <Badge variant="secondary" className="text-xs">
                {mostRequestedGames.length}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {mostRequestedGames.slice(0, 6).map(({ game, requestCount }) => (
                <GameDiscoveryCard
                  key={game.id}
                  game={game}
                  requestCount={requestCount}
                  selected={selectedGameIds.has(game.id)}
                  onSelect={(selected) => handleSelectGame(game.id, selected)}
                  onRulebookSet={handleRulebookSet}
                />
              ))}
            </div>
          </section>
        )}

        {/* Family Sections */}
        {filteredFamilies.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Game Families</h2>
              <Badge variant="secondary" className="text-xs">
                {filteredFamilies.length} families
              </Badge>
            </div>
            <div className="space-y-4">
              {filteredFamilies.map(family => (
                <FamilySection
                  key={family.id}
                  family={family}
                  selectedGameIds={selectedGameIds}
                  onSelectGame={handleSelectGame}
                  onSelectAllInFamily={handleSelectAllInFamily}
                  expandedByDefault={searchQuery.length > 0 || filteredFamilies.length === 1}
                  onRulebookSet={handleRulebookSet}
                  gameFilter={gameMatchesFilters}
                />
              ))}
            </div>
          </section>
        )}

        {/* Standalone Games */}
        {filteredStandaloneGames.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Box className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Standalone Games</h2>
              <Badge variant="secondary" className="text-xs">
                {filteredStandaloneGames.length}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredStandaloneGames.map(game => (
                <GameDiscoveryCard
                  key={game.id}
                  game={game}
                  requestCount={requestCountMap.get(game.id)}
                  selected={selectedGameIds.has(game.id)}
                  onSelect={(selected) => handleSelectGame(game.id, selected)}
                  onRulebookSet={handleRulebookSet}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {filteredFamilies.length === 0 && filteredStandaloneGames.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Box className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium mb-1">No games found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>

      {/* Batch Action Bar */}
      <BatchActionBar
        selectedGames={selectedGames}
        families={families}
        onClearSelection={handleClearSelection}
        onStartProcessing={handleStartProcessing}
      />
    </div>
  )
}
