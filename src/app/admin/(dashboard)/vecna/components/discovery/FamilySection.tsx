'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckSquare, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { VecnaFamily, VecnaGame } from '@/lib/vecna'
import { GameDiscoveryCard } from './GameDiscoveryCard'

interface FamilySectionProps {
  family: VecnaFamily
  selectedGameIds: Set<string>
  onSelectGame: (gameId: string, selected: boolean) => void
  onSelectAllInFamily: (familyId: string, selected: boolean) => void
  expandedByDefault?: boolean
  onRulebookSet?: () => void
  /** Optional filter function to show only certain games */
  gameFilter?: (game: VecnaGame) => boolean
}

export function FamilySection({
  family,
  selectedGameIds,
  onSelectGame,
  onSelectAllInFamily,
  expandedByDefault = false,
  onRulebookSet,
  gameFilter,
}: FamilySectionProps) {
  const [expanded, setExpanded] = useState(expandedByDefault)

  // Apply filter if provided
  const visibleGames = gameFilter ? family.games.filter(gameFilter) : family.games

  if (visibleGames.length === 0) return null

  // Calculate selection state
  const selectedCount = visibleGames.filter(g => selectedGameIds.has(g.id)).length
  const allSelected = selectedCount === visibleGames.length && selectedCount > 0
  const someSelected = selectedCount > 0 && selectedCount < visibleGames.length

  // Calculate progress
  const publishedPercent = family.total_games > 0
    ? Math.round((family.published_count / family.total_games) * 100)
    : 0

  // Count games ready to process (have rulebook, not published)
  const readyToProcess = visibleGames.filter(g =>
    g.has_rulebook && !g.is_published && g.vecna_state !== 'generated' && g.vecna_state !== 'review_pending'
  ).length

  return (
    <div className="border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
        {/* Expand/collapse area - clickable */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-3 min-w-0 flex-1 text-left"
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate">{family.name}</span>
              <Badge variant="secondary" className="text-xs">
                {visibleGames.length} game{visibleGames.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <Progress value={publishedPercent} className="w-24 h-1.5" />
              <span className="text-xs text-muted-foreground">
                {family.published_count}/{family.total_games} published
              </span>
              {readyToProcess > 0 && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  {readyToProcess} ready
                </span>
              )}
              {family.missing_rulebook_count > 0 && (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  {family.missing_rulebook_count} need rulebook
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Selection toggle - separate button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground h-8 flex-shrink-0"
          onClick={() => onSelectAllInFamily(family.id, !allSelected)}
        >
          {allSelected ? (
            <CheckSquare className="h-4 w-4 text-primary" />
          ) : someSelected ? (
            <div className="h-4 w-4 border-2 rounded-sm bg-primary/20" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          <span className="text-xs">
            {allSelected ? 'Deselect all' : someSelected ? `${selectedCount} selected` : 'Select all'}
          </span>
        </Button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="p-4 pt-0 border-t">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pt-4">
            {visibleGames.map(game => (
              <GameDiscoveryCard
                key={game.id}
                game={game}
                selected={selectedGameIds.has(game.id)}
                onSelect={(selected) => onSelectGame(game.id, selected)}
                onRulebookSet={onRulebookSet}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
